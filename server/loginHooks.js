// map of connection ids -> publish function contexts
let publishers = {}

// a resume event can occur before the publisher is added to publishers,
// so until it is, add to the queue
// 
// map of connection ids -> array of docs to publish
let publishQueue = {
  add(connection, doc) {
    let connId = connection.id
    if (! this[connId])
      this[connId] = []

    this[connId].push(doc)

    this.cleanup(connection)
  },

  cleanup(connection) {
    if (! connection._rolesCleanupSet) {
      connection._rolesCleanupSet = true
      connection.onClose(function() {
        delete publishQueue[connection.id]
      })
    }
  }
}

    
Meteor.publish('roles-restricted/login-hooks', function () {
  let connId = this.connection.id
  l('publishing login hooks for connId:', connId)

  publishers[connId] = this

  let queue = publishQueue[connId]
  if (queue) 
    for (doc of queue) {
      l('adding from queue', connId, doc)
      this.added('roles-restricted/login-hooks', Random.id(), doc)
    }

  delete publishQueue[connId]

  this.ready()

  // XXX is onStop called when connection is broken?
  this.onStop(() => {
    delete publishers[connId]
  })

  // Meteor.setTimeout(() => {
  //   this.added('roles-restricted/login-hooks', 'fake', {test: 1})
  //   publishers[connId].added('roles-restricted/login-hooks', 'fake2', {test: 2})
  // }, 2000)
})

// first argument is an attempt info object:
// http://docs.meteor.com/#/full/accounts_validateloginattempt
let handleLoginEvent = function({connection, type, user}, loggedIn) {
  let connId = connection.id,
      publisher = publishers[connId]

  l('handleLoginEvent', loggedIn, type, connId)

  let data = {loggedIn, type, connId}
  if (loggedIn)
    data.userId = user._id

  if (publisher) {
    l('adding data directly to publisher:', data, connId)
    publisher.added('roles-restricted/login-hooks', Random.id(), data)
  } else {
    publishQueue.add(connection, data)
  }
}

Accounts.onLogin(function (loginAttempt) {
  handleLoginEvent(loginAttempt, true)
  Roles._unrestrictConnection(loginAttempt.connection)
})

Accounts.onLoginFailure(function (loginAttempt) {
  handleLoginEvent(loginAttempt, false)
})
