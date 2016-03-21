class RestrictedAccessToken extends LoginLinks.AccessToken {

  constructor(token) {
    if (! (token.type || token.roles))
      throw new Meteor.Error('restricted-roles error: token must have either `type` or `roles` field')

    super(token)
  }

  get isRestricted() {
    return !! (this.roles || this.typeConfig.roles)
  }

}

Roles.RestrictedAccessToken = RestrictedAccessToken
