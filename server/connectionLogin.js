LoginLinks.onConnectionLogin(function(token, user) {
  if (Roles._isRestrictedToken(token))
    Roles.restrict(token)
})
