let createUserAndToken = function(opts, cb) {
  localStorage.clear()
  Meteor.call('cleardb')
  Accounts.createUser({
    email: 'a@b',
    password: 'a'
  }, function(){
    let userId = Meteor.userId()
    Meteor.logout(function() {
      Meteor.call('setRolesAndGenerateToken', userId, {'group1': ['user', 'admin'], 'group2': ['user']}, opts, function(e, token) {
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
  'roles-restricted - generateToken works',
  function (test, done) {
    createUserAndToken(restriction, function(targetId, token) {
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

