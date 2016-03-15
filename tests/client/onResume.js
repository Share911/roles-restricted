// So you can be access in client JS console
window.Meteor = Meteor
window.Roles = Roles

let addBadResumeToken = function(expired) {
  let expiration = Date.now()
  if (expired)
    expiration -= 60 * 1000 // minute ago
  else
    expiration += 10 * 60 * 1000 // ten minutes hence
  
  localStorage.setItem('Meteor.loginToken', 'e10F51nigkFsShxmvkLnlQ76Kzjh7h9pMuNxpVpO8Va')
  localStorage.setItem('Meteor.loginTokenExpires', new Date(expiration))
  localStorage.setItem('Meteor.userId', 'myid')
}

localStorage.clear()

// Tinytest.addAsync(
//   'roles-restricted - onResume called on success',
//   function(test, done) {
//     login(function() {
//       // Meteor.disconnect()
//     })
    
//     // Roles.onResumeAttemptCompleted(function({loggedIn}) {
//     //   test.isTrue(loggedIn)
//     //   done()
//     // })
//   })


Tinytest.addAsync(
  'roles-restricted - onResume called on failure',
  function(test, done) {
    Roles.onResumeAttemptCompleted(function({loggedIn}) {
      test.isFalse(loggedIn)
      done()
    })
    addBadResumeToken(false)
  })

Tinytest.addAsync(
  'roles-restricted - onResume not called when resume token is expired',
  function(test, done) {
    Roles.onResumeAttemptCompleted(function() {
      test.isTrue(false)
    })
    addBadResumeToken(true)
    setTimeout(function() {
      done()
    }, 1000)
  })

