Tinytest.addAsync(
  'roles-restricted - unrestricted works with password login',
  function(test, done) {
    login(function() {
      l('d',Meteor.connection._roles)
      test.isTrue(Roles.isUnrestricted())

      Meteor.logout()

      test.isFalse(Roles.isUnrestricted())

      Meteor.loginWithPassword('a@b','a', function(e, r) {
        l('withpass')
        test.isTrue(Roles.isUnrestricted())
        done()
      })
    })
  })

Tinytest.addAsync(
  'roles-restricted - unrestricted after resume',
  function(test, done) {
    login(function() {
      Meteor.disconnect()

      Roles.onResumeAttemptCompleted(function() {
        test.isTrue(Roles.isUnrestricted())
        done()
      })

      Meteor.reconnect()
    })
  })


