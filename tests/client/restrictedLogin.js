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
  group: 'group1'
}

Tinytest.addAsync(
  'roles-restricted - generateToken works and can do a full login later',
  function (test, done) {
    createUserAndToken(restriction, function(targetId, token) {
      test.isNull(Meteor.userId())

      Roles.restrictedLogin(token, function (e) {
        test.isUndefined(e)
        test.equal(Meteor.userId(), targetId)

        test.isFalse(Roles.isUnrestricted())

        Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
          test.equal(r, ['user'])

          Meteor.loginWithPassword('a@b', 'a', function() {
            test.isTrue(Roles.isUnrestricted())
            
            test.equal(Roles.getRolesForUser(targetId, 'group1'), ['user', 'admin'])
            test.equal(Roles.getRolesForUser(targetId, 'group2'), ['user'])
            test.equal(Roles.getRolesForUser(targetId), [])

            Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
              test.equal(r, ['user', 'admin'])
              
              done()
            })
          })
        })
      })
    })
  }
)

Tinytest.addAsync(
  'roles-restricted - generateToken works with types',
  function (test, done) {
    Meteor.call('setRestrictionTypes', {
      userOnly: restriction
    })
    
    createUserAndToken({type: 'userOnly'}, function(targetId, token) {
      test.isNull(Meteor.userId())

      Roles.restrictedLogin(token, function (e) {
        test.isUndefined(e)
        test.equal(Meteor.userId(), targetId)

        test.equal(Roles.getRolesForUser(targetId, 'group1'), ['user'])
        test.equal(Roles.getRolesForUser(targetId, 'group2'), [])
        test.equal(Roles.getRolesForUser(targetId), [])
        done()
      })
    })
  }
)

Tinytest.addAsync(
  'roles-restricted - generateToken works with types and group',
  function (test, done) {
    Meteor.call('setRestrictionTypes', {
      userOnly: {roles: ['user']}
    })
    
    createUserAndToken({type: 'userOnly', group: 'group1'}, function(targetId, token) {
      test.isNull(Meteor.userId())

      Roles.restrictedLogin(token, function (e) {
        test.isUndefined(e)
        test.equal(Meteor.userId(), targetId)

        test.equal(Roles.getRolesForUser(targetId, 'group1'), ['user'])
        test.equal(Roles.getRolesForUser(targetId, 'group2'), [])
        test.equal(Roles.getRolesForUser(targetId), [])
        done()
      })
    })
  }
)

Tinytest.addAsync(
  'roles-restricted - works server-side',
  function (test, done) {
    createUserAndToken(restriction, function(targetId, token) {
      Roles.restrictedLogin(token, function (e) {
        Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
          test.equal(r, ['user'])
          Meteor.call('getRolesForUser', targetId, 'group2', function(e, r) {
            test.equal(r, [])
            Meteor.call('getRolesForUser', targetId, function(e, r) {
              test.equal(r, [])
              done()
            })
          })
        })
      })
    })
  })

Tinytest.addAsync(
  "roles-restricted - works inside publication",
  function (test, done) {
    createUserAndToken(restriction, function(targetId, token) {
      test.isNull(Meteor.userId())

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


Tinytest.addAsync(
  'roles-restricted - restricts on reconnect',
  function (test, done) {
    createUserAndToken(restriction, function(targetId, token) {
      test.isNull(Meteor.userId())

      Roles.restrictedLogin(token, function (e) {
        test.isUndefined(e)
        test.equal(Meteor.userId(), targetId)

        test.isFalse(Roles.isUnrestricted())

        Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
          test.equal(r, ['user'])


          Meteor.disconnect()

          // re-setup hook because might have been overwritten by
          // loginWithPassword in previous test
          Meteor.connection.onReconnect = null
          Roles._setupOnReconnectHook()

          existingHook = Meteor.connection.onReconnect
          Meteor.connection.onReconnect = function() {
            existingHook()

            test.isTrue(Accounts.loggingIn())

            setTimeout(function(){
              test.equal(Meteor.userId(), targetId)
              test.isFalse(Roles.isUnrestricted())
              test.isNotUndefined(Meteor.connection._roles.restrictedRoles)

              Meteor.call('getRolesForUser', targetId, 'group1', function(e, r) {
                test.equal(r, ['user'])
                
                done()
              })
            }, 1000)
          }

          Meteor.reconnect()
        })
      })
    })
  })
