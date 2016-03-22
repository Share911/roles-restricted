l = function(){}

// uncomment while debugging:
l = function(){
  console.log(...arguments)
}


let _BaseRoles = Roles

Roles = _.clone(_BaseRoles)

_.extend(Roles, {

  _BaseRoles,

  isUnrestricted(conn) {
    conn || (conn = this._getConnection())
    return conn._userId && conn._roles && conn._roles.unrestricted
  },

  restrict({type, roles, group}) {
    //call method on client
    // check not already logged in
    let conn = this._getConnection()

    if (!conn._roles)
      conn._roles = {}

    if (conn._roles.unrestricted)
      delete conn._roles.unrestricted

    conn._roles.restrictedRoles = {}
    if (group)
      conn._roles.restrictedRoles.group = group

    conn._roles.restrictedRoles.roles = roles
  },
  
  getRestriction() {
    let conn = this._getConnection()

    if (conn && conn._roles && conn._roles.restrictedRoles) {
      return conn._roles.restrictedRoles
    } else {
      return {roles: []}
    }
  },

  determineRoles(user) {
    let restriction = Roles.getRestriction()

    if (Roles.isUnrestricted()) {
      return user.roles
    } else if (restriction) {
      if (restriction.group) {
        let roles = {}
        let userRoles = user.roles[restriction.group]
        // l('userRoles', user, restriction, _.intersection(userRoles, restriction.roles))

        roles[restriction.group] = _.intersection(userRoles, restriction.roles)
        return roles

      } else {
        return _.intersection(user.roles, restriction.roles)
      }
    } else {
      return []
    }
  },


  _getConnection() {
    if (Meteor.isServer)
      return DDP._CurrentInvocation.get().connection
    else
      return Meteor.connection
  },
  
  _unrestrictConnection(conn) {
    l('unrestricted')
    conn || (conn = this._getConnection())

    if (!conn._roles)
      conn._roles = {}
    conn._roles.unrestricted = true
  },

  _clearUnrestriction(conn) {
    l('clear unrestricted')
    conn || (conn = this._getConnection())

    if (conn._roles)
      delete conn._roles.unrestricted
  }

}) // end _.extend(Roles, ...)
