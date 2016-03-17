addBadResumeToken = function() {
  localStorage.setItem('Meteor.loginToken', 'e10F51nigkFsShxmvkLnlQ76Kzjh7h9pMuNxpVpO8Va')
  localStorage.setItem('Meteor.userId', 'myid')
}

localStorage.clear()

Tinytest.addAsync(
  'roles-restricted - onResume called on failure',
  function(test, done) {
    let hook = Roles.onResumeAttemptCompleted(function(loggedIn) {
      test.isFalse(loggedIn)
      Roles.removeResumeAttemptCompletedHook(hook)
      done()
    })
    addBadResumeToken(false)
  })

Tinytest.addAsync(
  'roles-restricted - onResume called on success',
  function(test, done) {
    login(function() {
      Meteor.disconnect()

      Roles.onResumeAttemptCompleted(function(loggedIn) {
        test.isTrue(loggedIn)
        done()
      })

      Meteor.reconnect()
    })
  })


