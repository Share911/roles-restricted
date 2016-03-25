_.extend(Roles, {
  
  _isRestrictedToken(token) {
    return !! (token.roles || (token.type && Roles._restrictionTypes[token.type]))
  }

})
