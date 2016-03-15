let resumeExpires = new Date(localStorage.getItem('Meteor.loginTokenExpires'))
Roles.resumeAttemptInitiated = resumeExpires && resumeExpires > new Date()

let LoginHooks = new Meteor.Collection('roles-restricted/login-hooks')

let unrestrictLogin = function({loggedIn, userId}) {
  let isCorrectUser = userId === Meteor.userId()
  if (loggedIn && isCorrectUser)
    Roles._unrestrictConnection()
}

let lastUserId

// On logout, remove unrestricted
Tracker.autorun(function() {
  // react to Meteor.userId()
  let userId = Meteor.userId()

  
  let wasLoggedIn = !! lastUserId,
      nowLoggedOut = ! userId

  if (wasLoggedIn && nowLoggedOut)
    Roles._clearUnrestriction()

  if (userId)
    lastUserId = userId
})

let hooks = []

Roles.onResumeAttemptCompleted = function(hook) {
  hooks.push(hook)
}

let callResumeAttemptCompletedHooks = function(data) {
  for (hook of hooks) {
    hook(data)
  }
}


// React to changes in connection id.
//
// http://docs.meteor.com/#/full/meteor_onconnection
//
// 3/11/16
// 
// Currently when a client reconnects to the server (such as after temporarily
// losing its Internet connection), it will get a new connection each time. The
// onConnection callbacks will be called again, and the new connection will have a
// new connection id.
// 
// In the future, when client reconnection is fully implemented, reconnecting from
// the client will reconnect to the same connection on the server: the onConnection
// callback won't be called for that connection again, and the connection will
// still have the same connection id.

// connectionId = Roles.connectionId = new ReactiveVar()

// Tracker.autorun(function() {
//   l('status autorun, connId: ', Meteor.connection._lastSessionId)
//   // Rerun when status changes, in case a new connection id
//   // will be set
//   Meteor.status()

//   // XXX is there a better way?
//   Meteor.setInterval(function() {
//     id = Meteor.connection._lastSessionId
//     l('id', id);
//     if (id) {
//       // Doesn't trigger invalidation if unchanged
//       connectionId.set(id)
//     } else {

//       // Just in case
//       let interval = Meteor.setInterval(function() {
//         l('interval id', id);
//         id = Meteor.connection._lastSessionId
//         if (id) {
//           Meteor.clearInterval(interval)
//           connectionId.set(id)
//         }
//       }, 100)
//     }
//   })

// })

// XXX is the old observeChanges stopped when the computation is rerun?
// http://stackoverflow.com/questions/35966225/are-stop-returning-functions-still-stopped-when-inside-nested-functions
// Tracker.autorun(function() {
//   let connId = connectionId.get()
//   l('connId autorun', connId)

//   Tracker.nonreactive(function() {
//     if (connId) {
//       LoginHooks.find(connId).observeChanges({
//         added(id, data) {
//           l('received data:', data, id)
//           if (data.type === 'resume')
//             callResumeAttemptCompletedHooks(data)

//           if (data.loggedIn)
//             unrestrictLogin(data)
//         }
//       })
//     }
//   })
// })

// Tracker.autorun(function() {
//   l('subscribing to login hooks for new connection', connectionId.get())
//   Meteor.subscribe('roles-restricted/login-hooks', connectionId.get())
// })

Meteor.subscribe('roles-restricted/login-hooks')

LoginHooks.find({}).observeChanges({
  added(id, data) {
    l('received data:', data.loggedIn, data.type, data.connId,
      Meteor.connection._lastSessionId)
    if (data.connId === Meteor.connection._lastSessionId) {
      if (data.type === 'resume')
        callResumeAttemptCompletedHooks(data)

      if (data.loggedIn)
        unrestrictLogin(data)
    }
  }
})
