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

  /**
   * Determine whether the connection is currently in an unrestricted state
   * @param {object} conn - in general, `DDP._CurrentInvocation.get().connection` on server or `Meteor.connection` on client
   */
  isUnrestricted(conn) {
    conn || (conn = this._getConnection())

    if (conn && conn._roles && conn._roles.unrestricted) {
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

  /**
   * Determine from a publisher whether the connection is currently in an unrestricted state
   * @param {object} context - `this` inside a publish function
   */
  isUnrestrictedFromPublish(context) {
    return this.isUnrestricted(this._getConnectionFromPublish(context))
  },

  /**
   * Restrict the current connection
   * @param {object} config - `groups` and either `type` or `roles`
   */
  restrict({type, roles, group, groups}) {
    if (group && groups) {
      throw new Error(`[roles-restricted.restrict] Only 'group' _or_ 'groups' argument permitted`)
    }
    if (group) {
      console.warn(`[roles-restricted.restrict] Argument 'group' is deprecated.  Pass 'groups' array argument instead`)
      console.trace()
      groups = [group]
      delete group
    }
    let conn = this._getConnection()

    if (!conn._roles)
      conn._roles = {}

    if (conn._roles.unrestricted)
      delete conn._roles.unrestricted

    if (type) {
      let typeConfig = Roles._restrictionTypes[type]
      roles = typeConfig.roles
      if (typeConfig.groups)
        groups = typeConfig.groups
    }

    conn._roles.restrictedRoles = {}
    if (groups) {
      if (typeof groups === 'string') {
        groups = [groups]
      }
      if (!Array.isArray(groups)) {
        throw new Error(`[roles-restricted.restrict] Argument 'groups' must be an array.`)
      }
      conn._roles.restrictedRoles.groups = groups
    }

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

  /**
   * @param {object} user - with `_id` and `roles`
   * @param {object} context - Usually `DDP._CurrentInvocation.get()`. Contains the current user's id and the connection.
   */
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
        conn = this._getConnectionFromPublish(context)
        currentUser = conn._userId
      }
    } else {
      try {
        currentUser = Meteor.userId()
      } catch(e) {
        throw new Error('roles-restricted: must provide context argument when checking roles outside of a normal method context')
      }
    }

    let restriction = Roles.getRestriction(conn)

    // l('determineRoles', Roles.isUnrestricted(conn), user._id !== currentUser, user._id, currentUser, conn)

    // restrictions only apply to current user
    if (Roles.isUnrestricted(conn) || (user._id !== currentUser)) {
      return user.roles
    } else if (restriction) {
      if (restriction.groups) {
        let roles = {}
        restriction.groups.forEach((group) => {
          let userRoles = user.roles ? user.roles[group] : []
          // l('userRoles', user, restriction, _.intersection(userRoles, restriction.roles))

          roles[group] = _.intersection(userRoles, restriction.roles)
        })
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
        groups: Match.Optional([String]),
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
        throw new Error('roles-restricted: if testing roles outside of a method context (for example inside Meteor.publish), you must provide a `context` argument')
      }
    } else {
      return Meteor.connection
    }
  },

  // inside publish functions, this.connection._userId isn't set
  _getConnectionFromPublish(context) {
    context.connection._userId = context.userId
    return context.connection
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
