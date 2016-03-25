_.extend(Roles, {

  restrictedLogin(token, cb) {
    LoginLinks.connectionLogin(token, function(error, data) {
      if (! error)
        Roles.restrict(data)

      cb(error, data)
    })
  },

  setDefaultExpirationInSeconds() {} // server-only

})
