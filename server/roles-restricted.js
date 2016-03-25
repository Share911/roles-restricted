_.extend(Roles, {
  
  generateRestrictedAccessToken: LoginLinks.generateAccessToken,

  setDefaultExpirationInSeconds: LoginLinks.setDefaultExpirationInSeconds,

  _isRestrictedToken(token) {
    return !! (token.roles || (token.type && Roles._restrictionTypes[token.type]))
  }

})
