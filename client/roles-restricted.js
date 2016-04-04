_.extend(Roles, {

  restrictedLogin(token, cb) {
    LoginLinks.connectionLogin(token, function(error, data) {
      if (! error)
        Roles.restrict(data)

      if (cb)
        cb(error, data)
    })
  },

  _setupOnReconnectHook: LoginLinks._setupHook

})

LoginLinks.connectionLoginReconnect = Roles.restrictedLogin
