import { Meteor } from "meteor/meteor"

let LoginHooks = new Meteor.Collection('roles-restricted/login-hooks')
const initialTimeout = 10
const maxTimeout = 300

/**
 * If it was an event from a successful login, and if the userId matches, then
unrestrict login
 * @param {string} userId - user _id
 */
function maybeUnrestrictLogin (userId, expBackoff = null) {
  const isCorrectUser = userId === Meteor.userId()

  if (isCorrectUser) {
    l('[maybeUnrestrictLogin] unrestricting connection')
    Roles._unrestrictConnection()
  } else {
    // sometimes Meteor.userId() has not been set until after some time passes
    // XXX is it ever not set? change to reactive trigger on Meteor.userId()?
    expBackoff = expBackoff || new GOOG.math.ExponentialBackoff(initialTimeout, maxTimeout)
    const timeout = expBackoff.getValue()

    l('[maybeUnrestrictLogin] users dont match', userId, Meteor.userId(), '. Trying again in', timeout)
    if (timeout > maxTimeout) {
      // stop checking
      console.warn("roles-restricted warning: onLogin server event userId ("
        + userId + ") doesn't match client Meteor.userId() (" +
        Meteor.userId() + "). Please submit an issue on Github.")
    } else {
      expBackoff.backoff()
      Meteor.setTimeout(function () {
        // schedule another check in a little while
        maybeUnrestrictLogin(userId, expBackoff)
      }, timeout)
    }
  }
}

let lastUserId = null

// on logout, remove unrestricted
Tracker.autorun(function() {
  // react to changes in Meteor.userId()
  let userId = Meteor.userId()

  let wasLoggedIn = !! lastUserId
  let nowLoggedOut = ! userId

  l('autorun: may remove unrestricted...', {wasLoggedIn, nowLoggedOut})
  if (wasLoggedIn && nowLoggedOut) {
    Roles._clearUnrestriction()
    l('autorun: removed unrestricted autorun')
  }

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

      if (data.loggedIn) {
        maybeUnrestrictLogin(data.userId)
      }
    }
  }
})
