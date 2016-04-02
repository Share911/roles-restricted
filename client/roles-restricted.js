_.extend(Roles, {

  restrictedLogin(token, cb) {
    LoginLinks.connectionLogin(token, function(error, data) {
      if (! error)
        Roles.restrict(data)

      if (cb)
        cb(error, data)
    })
  },

  setDefaultExpirationInSeconds() {} // server-only

})

LoginLinks.connectionLoginReconnect = Roles.restrictedLogin
