class RestrictedAccessToken extends LoginLinks.AccessToken {

  constructor(token) {
    if (! (token.type || token.roles))
      throw new Meteor.Error('restricted-roles error: token must have either `type` or `roles` field')

    if (token.type && ! Roles._restrictionTypes[token.type])
      throw new Meteor.Error('restricted-roles error: known type')

    super(token)
  }

}

RestrictedAccessToken.isRestricted = function(token) {
  return !! (token.type || token.roles)
}

Roles.RestrictedAccessToken = RestrictedAccessToken
