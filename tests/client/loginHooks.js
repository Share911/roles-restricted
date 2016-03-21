Tinytest.addAsync(
  'roles-restricted - unrestricted works with password login',
  function(test, done) {
    login(function() {
      test.isTrue(Roles.isUnrestricted())

      Meteor.logout(function() {
        test.isFalse(Roles.isUnrestricted())

        Meteor.loginWithPassword('a@b','a', function(e, r) {
          // wait for unrestriction
          Meteor.defer(function() {
            test.isTrue(Roles.isUnrestricted())
            done()
          })
        })
      })
    })
  })

Tinytest.addAsync(
  'roles-restricted - unrestricted after resume',
  function(test, done) {
    login(function() {
      Meteor.disconnect()

      let hook = Roles.onResumeAttemptCompleted(function() {
        test.isTrue(Roles.isUnrestricted())
        Roles.removeResumeAttemptCompletedHook(hook)
        done()
      })

      Meteor.reconnect()
    })
  })


