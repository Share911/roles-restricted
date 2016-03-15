l = function(){}

l = function(){
  console.log(...arguments)
}


let _BaseRoles = Roles

Roles = {
  _BaseRoles,

  _getConnection() {
    if (Meteor.isServer)
      return DDP._CurrentInvocation.get().connection
    else
      return Meteor.connection
  },
  
  _unrestrictConnection(conn) {
    conn || (conn = this._getConnection())

    if (!conn._roles)
      conn._roles = {}
    conn._roles.unrestricted = true
  },

  _clearUnrestriction(conn) {
    conn || (conn = this._getConnection())

    if (conn._roles)
      delete conn._roles.unrestricted
  }
}
