l = function(){}

// uncomment while debugging:
l = function(){
  console.log(...arguments)
}


let _BaseRoles = Roles

Roles = {
  isUnrestricted(conn) {
    conn || (conn = this._getConnection())
    return conn._userId && conn._roles && conn._roles.unrestricted
  },

  restrict({type, roles, group}) {
    //call method on client
    // check not already logged in
    conn = this._getConnection()

    if (!conn._roles)
      conn._roles = {}

    if (conn._roles.unrestricted)
      delete conn._roles.unrestricted

    if (group) {
      conn._roles.restrictedRoles = {}
      conn._roles.restrictedRoles[group] = roles
    } else {
      conn._roles.restrictedRoles = roles
    }
  },
  
  restrictedRoles() {
    conn = this._getConnection()

    if (conn && conn._roles && conn._roles.restrictedRoles) {
      return conn._roles.restrictedRoles
    } else {
      return []
    }
  },

  determineRoles(user) {
    if (Roles.isUnrestricted())
      return user.roles
    else if (Roles.restrictedRoles())
      return _.intersection(user.roles, Roles.restrictedRoles())
    else
      return []
  },


  _BaseRoles,

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
}
