let normalizedUser = function(user) {
  if ('string' === typeof user) {
    user = Meteor.users.findOne(
      {_id: user},
      {fields: {roles: 1}})
  } 

  // don't alter the object given
  user = _.clone(user)
  
  user.roles = Roles.determineRoles(user)

  return user
}

_.extend(Roles, {
  
  userIsInRole(user, roles, group) {
    // l('args', ...arguments)
    // l(Roles._BaseRoles.userIsInRole(...arguments))
    user = normalizedUser(user)
    return Roles._BaseRoles.userIsInRole(user, roles, group)
  }

})


