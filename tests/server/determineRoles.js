Tinytest.addAsync(
  'roles-restricted - throws context error',
  function (test, done) {
    Meteor.defer(function() {
      test.throws(function () {
        Roles.determineRoles('foo')
      }, Error)
      done()
    })
  })
