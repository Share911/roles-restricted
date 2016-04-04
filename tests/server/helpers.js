Meteor.methods({

  cleardb() {
    Meteor.users.remove({})
  },

  whoami() {
    l('whoami: ', Meteor.userId())
    return Meteor.userId()
  },

  serverConnId() {
    l('serverConnId: ', DDP._CurrentInvocation.get().connection)
    return DDP._CurrentInvocation.get().connection.id
  },

  setRoles(roles) {
    DDP._CurrentInvocation.get().connection._roles = _roles
  },

  roles() {
    roles = DDP._CurrentInvocation.get().connection._roles
    l('roles: ', roles)
    return roles
  },

  getRolesForUser(user, group) {
    return Roles.getRolesForUser(user, group)
  },

  setRolesAndGenerateToken(userId, roles, opts) {
    Meteor.users.update(userId, {$set: {roles}})
    return Roles.generateRestrictedAccessToken(userId, opts)
  }

})

Meteor.publish('test', function() {
  // l('connection: ', DDP._CurrentInvocation.get(), this.userId, this.connection._roles)

  if (Roles.userIsInRole(this.userId, ['admin'], 'group1', this))
    console.log('publish test FAILED')
  else
    console.log('publish test success')

  // let user = Meteor.users.findOne(this.userId)
  // if (user)
  //   l('user.roles', user.roles)
})
