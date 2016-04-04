let normalizedUser = function(user, context) {
  l('normalizedUser', user, context)
  if ('string' === typeof user) {
    user = Meteor.users.findOne(
      {_id: user},
      {fields: {roles: 1}})
  } else {
    // don't mutate the object given
    user = _.clone(user)
  }

  if (!user)
    return null
  
  user.roles = Roles.determineRoles(user, context)

  return user
}

_.extend(Roles, {
  
  userIsInRole(user, roles, group, context) {
    // l('userIsInRole roles, group: ', roles, group)
    // l(Roles._BaseRoles.userIsInRole(...arguments), user.roles)
    user = normalizedUser(user, context)
    // l('normalizedUser.roles', user && user.roles)
    return Roles._BaseRoles.userIsInRole(user, roles, group)
  },

  getRolesForUser(user, group, context) {
    user = normalizedUser(user, context)
    return Roles._BaseRoles.getRolesForUser(user, group)
  }

})


