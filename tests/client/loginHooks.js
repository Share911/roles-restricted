import { Meteor } from 'meteor/meteor'
import { _ } from 'meteor/underscore'
import { expect } from 'meteor/practicalmeteor:chai'

describe('roles-restricted', function () {
  this.timeout(5000)

  context('loginHooks', function () {

    it('unrestricted access - works with password login', function (done) {
      login(function() {
        Meteor.setTimeout(function () {
          try {
            expect(Roles.isUnrestricted()).to.be.true
          } catch (ex) {
            done(new Error('Initial login not unrestricted'))
          }
        }, 1000)

        Meteor.logout(function() {
          try {
            expect(Roles.isUnrestricted()).to.be.false
          } catch (ex) {
            done(ex)
          }

          Meteor.loginWithPassword('a@b','a', function(e, r) {
            // wait for unrestriction
            Meteor.setTimeout(function() {
              try {
                expect(Roles.isUnrestricted()).to.be.true
                done()
              } catch (ex) {
                done(new Error('Login with password not unrestricted'))
              }
            }, 1000)
          })
        })
      })
    })

    it('unrestricted access - unrestricted after resume', function (done) {
      login(function() {
        Meteor.disconnect()

        let hook = Roles.onResumeAttemptCompleted(function() {
          Meteor.setTimeout(function () {
            try {
              expect(Roles.isUnrestricted()).to.be.true
              Roles.removeResumeAttemptCompletedHook(hook)
              done()
            } catch (ex) {
              done(ex)
            }
          }, 100)
        })

        Meteor.reconnect()
      })
    })

  })
})
