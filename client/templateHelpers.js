_.extend(Roles, {

  /**
   * Check whether the current user is in the given role, assuming the user is unrestricted.
   * Modified from `Roles._uiHelpers.isInRole`:
   * https://github.com/alanning/meteor-roles/blob/master/roles/client/uiHelpers.js#L45
   * (added `._BaseRoles`)
   * @param {string} role
   * @param {string} group
   */
  isInRoleWhenUnrestricted(role, group) {
    var user = Meteor.user(),
        comma = (role || '').indexOf(','),
        roles

    if (!user) return false
    if (!Match.test(role, String)) return false

    if (comma !== -1) {
      roles = _.reduce(role.split(','), function (memo, r) {
        if (!r || !r.trim()) {
          return memo
        }
        memo.push(r.trim())
        return memo
      }, [])
    } else {
      roles = [role]
    }

    if (Match.test(group, String)) {
      return Roles._BaseRoles.userIsInRole(user, roles, group)
    }

    return Roles._BaseRoles.userIsInRole(user, roles)
  }

})

if ('undefined' !== typeof Template && Template.registerHelper) {
  Template.registerHelper('isInRoleWhenUnrestricted', Roles._isInRoleWhenUnrestricted)
}
