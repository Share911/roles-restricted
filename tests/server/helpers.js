Meteor.methods({

  cleardb() {
    Meteor.users.remove({})
  },

  whoami() {
    l('whoami: ', Meteor.userId())
    return Meteor.userId()
  },

  serverConnId() {
    l('serverConnId: ', DDP._CurrentInvocation.get().connection.id)
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

  setRolesAndGenerateToken(userId, roles, opts) {
    Meteor.users.update(userId, {$set: {roles}})
    return Roles.generateRestrictedAccessToken(userId, opts)
  }

})
