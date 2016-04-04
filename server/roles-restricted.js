_.extend(Roles, {
  
  generateRestrictedAccessToken: LoginLinks.generateAccessToken,

  _isRestrictedToken(token) {
    return !! (token.roles || (token.type && Roles._restrictionTypes[token.type]))
  }

})
