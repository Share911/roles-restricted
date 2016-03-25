let createUserAndToken = function(opts, cb) {
  localStorage.clear()
  Meteor.call('cleardb')
  Accounts.createUser({
    email: 'a@b',
    password: 'a'
  }, function(){
    let userId = Meteor.userId()
    Meteor.logout(function() {
      Meteor.call('setRolesAndGenerateToken', userId, {'group1': ['user', 'admin']}, opts, function(e, token) {
        cb(userId, token)
      })
    })
  })
}

Tinytest.addAsync(
  'roles-restricted: generateToken works with types',
  function (test, done) {
    Meteor.call('setRestrictionTypes', {
      userOnly: {
        roles: ['user'],
        group: 'group1'
      }
    })
      
    createUserAndToken({type: 'userOnly'}, function(targetId, token) {
      test.isNull(Meteor.userId())

      Roles.restrictedLogin(token, function (e) {
        test.isUndefined(e)
        test.equal(Meteor.userId(), targetId)

        test.equal(Roles.getRolesForUser(targetId, 'group1'), ['user'])
        test.equal(Roles.getRolesForUser(targetId), [])
      })
    })
  }
)
