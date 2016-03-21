let LoginHooks = new Meteor.Collection('roles-restricted/login-hooks')

let maybeUnrestrictLogin = function({loggedIn, userId}) {
  if (loggedIn) {
    let isCorrectUser = userId === Meteor.userId()

    if (isCorrectUser) {
      Roles._unrestrictConnection()

    } else {
      // sometimes Meteor.userId() has not been set until after deferring
      // XXX is it ever not set? change to reactive trigger on Meteor.userId()?
      Meteor.defer(function() {
        isCorrectUser = userId === Meteor.userId()
        if (isCorrectUser) {
          l('deferred unrestricting')
          Roles._unrestrictConnection()
        } else {
          console.warn("roles-restricted warning: onLogin server event userId ("
                       + userId + ") doesn't match client Meteor.userId() (" +
                       Meteor.userId() + "). Please submit an issue on Github.")
        }
      })
    }
  }
}

let lastUserId = null

// on logout, remove unrestricted
Tracker.autorun(function() {
  // react to changes in Meteor.userId()
  let userId = Meteor.userId()
  
  let wasLoggedIn = !! lastUserId,
      nowLoggedOut = ! userId

  l('remove unrestricted autorun', wasLoggedIn, nowLoggedOut)
  if (wasLoggedIn && nowLoggedOut)
    Roles._clearUnrestriction()

  if (userId)
    lastUserId = userId
})

let hooks = []

Roles.onResumeAttemptCompleted = function(hook) {
  hooks.push(hook)
  return hook
}

Roles.removeResumeAttemptCompletedHook = function(hook) {
  hooks = _.without(hooks, hook)
}

let callResumeAttemptCompletedHooks = function(data) {
  for (hook of hooks) {
    hook(data)
  }
}

Meteor.subscribe('roles-restricted/login-hooks')

LoginHooks.find({}).observeChanges({
  added(id, data) {
    l('received data:', data.loggedIn, data.type, data.connId,
      Meteor.connection._lastSessionId)
    if (data.connId === Meteor.connection._lastSessionId) {
      if (data.type === 'resume')
        callResumeAttemptCompletedHooks(data.loggedIn)

      if (data.loggedIn)
        maybeUnrestrictLogin(data)
    }
  }
})
