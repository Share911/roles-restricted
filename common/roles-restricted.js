l = function(){}

// uncomment while debugging:
// l = function(){
//   console.log(...arguments)
// }


let _BaseRoles = Roles

Roles = _.clone(_BaseRoles)

_.extend(Roles, {

  _BaseRoles,

  setDefaultExpirationInSeconds: LoginLinks.setDefaultExpirationInSeconds,

  isUnrestricted(conn) {
    conn || (conn = this._getConnection())

    if (conn._roles && conn._roles.unrestricted) {
      if (conn._userId) {
        return true
      } else {
        // when conn._userId isn't set, check Meteor.userId() 
        let user = null
        try {
          user = Meteor.userId()
        } catch(e) {
          return false
        }
        return !! user
      }
    } else {
      return false
    }
  },

  restrict({type, roles, group}) {
    let conn = this._getConnection()

    if (!conn._roles)
      conn._roles = {}

    if (conn._roles.unrestricted)
      delete conn._roles.unrestricted

    if (type) {
      let typeConfig = Roles._restrictionTypes[type]
      roles = typeConfig.roles
      if (typeConfig.group)
        group = typeConfig.group
    }

    conn._roles.restrictedRoles = {}
    if (group)
      conn._roles.restrictedRoles.group = group

    conn._roles.restrictedRoles.roles = roles
  },
  
  getRestriction(conn) {
    conn || (conn = this._getConnection())

    if (conn && conn._roles && conn._roles.restrictedRoles) {
      return conn._roles.restrictedRoles
    } else {
      return {roles: []}
    }
  },

  determineRoles(user, context) {
    let conn = null

    // l('determineRoles', user, context)
    
    if (!user)
      return []

    let currentUser = null
    if (context) {
      if (context.unrestricted) {
        conn = {
          connection: {
            _userId: 'bypass-userId-check',
            _roles: {unrestricted: true}
          }
        }
        
      } else {
        // inside publish functions, this.connection._userId isn't set
        context.connection._userId = context.userId
        conn = context.connection
        currentUser = context.userId
      }
    } else {
      try {
        currentUser = Meteor.userId()
      } catch(e) {
        throw new Meteor.Error('roles-restricted: must provide context argument when checking roles outside of a normal method context')
      }
    }

    let restriction = Roles.getRestriction(conn)

    // l('determineRoles', Roles.isUnrestricted(conn), user._id !== currentUser, user._id, currentUser, conn)
    
    // restrictions only apply to current user
    if (Roles.isUnrestricted(conn) || (user._id !== currentUser)) {
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
      // if somehow Meteor.userId() is set but the connection is neither
      // restricted nor unrestricted, default secure
      return []
    }
  },

  _restrictionTypes: {},

  setRestrictionTypes(types) {
    for (let name in types) {
      // l('setRestrictionTypes', name, type, types)
      let type = types[name]
      check(type, {
        roles: [String],
        group: Match.Optional(String),
        expirationInSeconds: Match.Optional(Match.Integer)
      }, 'incorrect setRestrictionTypes format')
    }
    
    this._restrictionTypes = types

    // don't call setTypes in case LoginLinks package is also used
    // (we'd be overwriting)
    // 
    // extra data in type objects doesn't matter
    _.extend(LoginLinks._accessTokenTypes, types) 
  },
  
  // -- private functions --

  _getConnection() {
    if (Meteor.isServer) {
      if (DDP._CurrentInvocation.get()) {
        return DDP._CurrentInvocation.get().connection
      } else {
        throw new Meteor.Error('roles-restricted: if testing roles outside of a method context (for example inside Meteor.publish), you must provide a `context` argument')
      }
    } else {
      return Meteor.connection
    }
  },
  
  _unrestrictConnection(conn) {
    l('unrestricted')
    conn || (conn = this._getConnection())

    if (!conn._roles)
      conn._roles = {}
    else
      delete conn._roles.restrictedRoles
    
    conn._roles.unrestricted = true
  },

  _clearUnrestriction(conn) {
    l('clear unrestricted')
    conn || (conn = this._getConnection())

    if (conn._roles)
      delete conn._roles.unrestricted
  }

}) // end _.extend(Roles, ...)
