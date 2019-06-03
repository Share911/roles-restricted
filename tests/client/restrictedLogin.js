import { Meteor } from 'meteor/meteor'
import { _ } from 'meteor/underscore'
import { expect } from 'meteor/practicalmeteor:chai'
import { arraysEqual } from './helpers'

let createUserAndToken = function(opts, cb) {
  localStorage.clear()
  Meteor.call('cleardb')
  Accounts.createUser({
    email: 'a@b',
    password: 'a'
  }, function(){
    let userId = Meteor.userId()
    Meteor.logout(function() {
      Meteor.call(
        'setRolesAndGenerateToken',
        userId,
        {
          'group1': ['user', 'admin'],
          'group2': ['user']
        },
        opts,
        function(e, token) {
          cb(userId, token)
        })
    })
  })
}

let restriction = {
  roles: ['user'],
  groups: ['group1'],
}

let _originalReconnectHook

describe('roles-restricted', function () {
  this.timeout(5000)

  afterEach(function () {
    if (_originalReconnectHook) {
      Meteor.connection.onReconnect = _originalReconnectHook
      _originalReconnectHook = null
    }
  })

  context('restrictedLogin', function () {

    it('generateToken works and can do a full login later', function (done) {
      createUserAndToken(restriction, function(targetId, token) {
        expect(Meteor.userId()).to.be.null

        Roles.restrictedLogin(token, function (e) {
          expect(e).to.be.undefined
          expect(Meteor.userId()).to.equal(targetId)

          expect(Roles.isUnrestricted()).to.be.false

          Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
            if (e) {
              done(e)
              return
            }
            expect(arraysEqual(r, ['user'])).to.be.true

            Meteor.loginWithPassword('a@b', 'a', function() {
              Meteor.setTimeout(function() {
                // console.log('getRolesForUser loginWithPassword', targetId, r)
                try {
                  expect(Roles.isUnrestricted()).to.be.true
                  
                  expect(arraysEqual(Roles.getRolesForUser(targetId, 'group1'), ['user', 'admin'])).to.be.true
                  expect(arraysEqual(Roles.getRolesForUser(targetId, 'group2'), ['user'])).to.be.true
                  let result = Roles.getRolesForUser(targetId)
                  expect(Array.isArray(result)).to.be.true
                  expect(result.length).to.equal(0)

                  Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
                    try {
                      expect(arraysEqual(r, ['user', 'admin'])).to.be.true
                      done()
                    } catch (ex) {
                      done(ex)
                    }
                  })
                } catch (ex) {
                  done(new Error('generateToken Login with password'))
                }
              }, 1000)
            })
          })
        })
      })
    })

    it('generateToken works with types', function (done) {
      Meteor.call('setRestrictionTypes', {
        userOnly: restriction
      })
      
      createUserAndToken({type: 'userOnly'}, function(targetId, token) {
        expect(Meteor.userId()).to.be.null

        Roles.restrictedLogin(token, function (e) {
          expect(e).to.be.undefined
          expect(Meteor.userId()).to.equal(targetId)

          expect(arraysEqual(Roles.getRolesForUser(targetId, 'group1'), ['user'])).to.be.true
          expect(arraysEqual(Roles.getRolesForUser(targetId, 'group2'), [])).to.be.true
          expect(arraysEqual(Roles.getRolesForUser(targetId), [])).to.be.true
          done()
        })
      })
    })

    it('generateToken works with types and group', function (done) {
      Meteor.call('setRestrictionTypes', {
        userOnly: {roles: ['user']}
      })
      
      createUserAndToken({type: 'userOnly', groups: ['group1']}, function(targetId, token) {
        expect(Meteor.userId()).to.be.null

        Roles.restrictedLogin(token, function (e) {
          expect(e).to.be.undefined
          expect(Meteor.userId()).to.equal(targetId)

          expect(arraysEqual(Roles.getRolesForUser(targetId, 'group1'), ['user'])).to.be.true
          expect(arraysEqual(Roles.getRolesForUser(targetId, 'group2'), [])).to.be.true
          expect(arraysEqual(Roles.getRolesForUser(targetId), [])).to.be.true
          done()
        })
      })
    })

    it('works server-side', function (done) {
      createUserAndToken(restriction, function(targetId, token) {
        Roles.restrictedLogin(token, function (e) {
          Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
            expect(arraysEqual(r, ['user'])).to.be.true
            Meteor.call('getRolesForUser', targetId, 'group2', function(e, r) {
              expect(arraysEqual(r, [])).to.be.true
              Meteor.call('getRolesForUser', targetId, function(e, r) {
                expect(arraysEqual(r, [])).to.be.true
                done()
              })
            })
          })
        })
      })
    })

    it("works inside publication", function (done) {
      createUserAndToken(restriction, function(targetId, token) {
        expect(Meteor.userId()).to.be.null

        Roles.restrictedLogin(token, function (e) {
          Meteor.call('serverConnId', function(e, r) {
            // Meteor.loginWithPassword('a@b', 'a', function() {
            sub = Meteor.subscribe('test')
            sub.stop()
            // check server log to verify 'publish test success'
            done()
          })
        })
      })
    })

    //
    // This test causes later tests loginHooks and onResume tests
    // to fail.  Uncomment to test and then recomment to test others.
    //
    it('restricts on reconnect', function (done) {
      createUserAndToken(restriction, function(targetId, token) {
        expect(Meteor.userId()).to.be.null

        Roles.restrictedLogin(token, function (e) {
          expect(e).to.be.undefined
          expect(Meteor.userId()).to.equal(targetId)

          expect(Roles.isUnrestricted()).to.be.false

          Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
            expect(arraysEqual(r, ['user'])).to.be.true

            Meteor.disconnect()

            // re-setup hook because might have been overwritten by
            // loginWithPassword in previous test
            Meteor.connection.onReconnect = null
            Roles._setupOnReconnectHook()

            _originalReconnectHook = Meteor.connection.onReconnect
            Meteor.connection.onReconnect = function() {
              _originalReconnectHook()

              expect(Accounts.loggingIn()).to.be.true

              setTimeout(function(){
                expect(Meteor.userId()).to.equal(targetId)
                expect(Roles.isUnrestricted()).to.be.false
                expect(Meteor.connection._roles.restrictedRoles).to.not.be.undefined

                Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
                  expect(arraysEqual(r, ['user'])).to.be.true
                  
                  done()
                })
              }, 1000)
            }

            Meteor.reconnect()
          })
        })
      })
    })

  })
})
