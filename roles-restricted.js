l = function(){}

// uncomment while debugging:
l = function(){
  console.log(...arguments)
}


let _BaseRoles = Roles

Roles = {
  isUnrestricted(conn) {
    conn || (conn = this._getConnection())
    return conn._roles && conn._roles.unrestricted
  },

  restrict({type, roles}) {
    //call method on client
    // check not already logged in
    conn = this._getConnection()
    0
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
