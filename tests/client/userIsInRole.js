import { Meteor } from 'meteor/meteor'
import { _ } from 'meteor/underscore'
import { expect } from 'meteor/practicalmeteor:chai'
import { arraysEqual } from './helpers'

let roles = ['admin', 'editor', 'user']

let users = {
  'eve': {
    _id: 'eve',
    roles: ['user', 'admin']
  },
  'bob': {
    _id: 'bob',
    roles: {
      'group1': ['user'],
      'group2': ['user', 'editor'],
      'group3': ['editor']
    }
  },
  'joe': {
    _id: 'joe',
    roles: {
      '__global_roles__': ['user', 'admin'],
      'group1': ['user', 'editor']
    }
  }
}

describe('roles-restricted', function () {
  context('helper funcs', function () {
    it('can compare equal arrays', function () {
      expect(arraysEqual(['user'], ['user'])).to.be.true
    })
    it('can compare inequal arrays', function () {
      expect(arraysEqual(['user'], ['bar'])).to.be.false
    })
  })
})

describe('roles-restricted', function () {
  this.timeout(5000)

  afterEach(function () {
    Meteor.logout()
  })

  context('restricted access', function () {

    it('can check if restricted user is in role', function () {
      testRestrictedUser('eve', ['user'])
      const actual = Roles.getRolesForUser(users['eve'])
      expect(arraysEqual(actual, ['user'])).to.be.true
    })

    it('can check if restricted user is in role by group', function () {
      testRestrictedUser('bob', ['user'], 'group1')
      testRestrictedUser('bob', ['user'], 'group2')
      testRestrictedUser('bob', [], 'group3')
    })

    it('can check if restricted user is in role with Roles.GLOBAL_GROUP', function () {
      testRestrictedUser('joe', ['user'], Roles.GLOBAL_GROUP)
      testRestrictedUser('joe', ['user'], 'group1')
    })

    it('can restrict multiple groups at once', function() {
      const username = 'bob'
      Meteor.connection.setUserId(username)
      Roles.restrict({roles: ['user'], groups: ['group1', 'group2']})
      testUser(username, ['user'], 'group1')
      testUser(username, ['user'], 'group2')
      testUser(username, [], 'group3')
    })
    it('can restrict multiple groups at once2', function() {
      const username = 'bob'
      Meteor.connection.setUserId(username)
      Roles.restrict({roles: ['user'], groups: ['group1', 'groups3']})
      testUser(username, ['user'], 'group1')
      testUser(username, [], 'group2')
      testUser(username, [], 'group3')
    })

    it('restricted user is in role with Roles.GLOBAL_GROUP when no group given', function() {
      const username = 'joe'
      Meteor.connection.setUserId(username)      
      Roles.restrict({roles: ['user'], groups: Roles.GLOBAL_GROUP})
      testUser(username, ['user'])
    })

    it('defaults secure when neither restricted nor unrestricted', function () {
      // clear connection from previous tests
      let conn = Meteor.connection
      delete conn._roles

      conn.setUserId('eve')    

      testUser('eve', [])
    })
      
    it("uses not-logged-in user's full roles", function () {
      Meteor.connection.setUserId('foo')    

      restriction = {roles: ['user']}
      Roles.restrict(restriction)
    
      testUser('eve', ['user', 'admin'])
      const actual = Roles.getRolesForUser(users['eve'])
      expect(arraysEqual(actual, ['user', 'admin'])).to.be.true
    })
  })

  context('unrestricted access', function () {

    it('can check if user is in role', function () {
      testUnrestrictedUser('eve', ['admin', 'user'])
    })

    it('can check if user is in role by group', function () {
      testUnrestrictedUser('bob', ['user'], 'group1')
      testUnrestrictedUser('bob', ['user', 'editor'], 'group2')
    })

    it('can check if user is in role with Roles.GLOBAL_GROUP', function () {
      testUnrestrictedUser('joe', ['user', 'admin'])
      testUnrestrictedUser('joe', ['user', 'admin'], Roles.GLOBAL_GROUP)
      testUnrestrictedUser('joe', ['user', 'editor', 'admin'], 'group1')
    })

    it('passing {unrestricted: true} as the context works', function () {
      Roles._clearUnrestriction()
      const actual = Roles.userIsInRole(users.joe, 'admin', null, {unrestricted: true})
      expect(actual).to.be.true
    })

  })
})


// -- restricted --

function testRestrictedUser (username, expectedRoles, group, restrictionGroups) {
  Meteor.connection.setUserId(username)      

  restriction = {roles: ['user']}
  if (restrictionGroups) {
    if (!Array.isArray(restrictionGroups))
      throw new Error('restrictionGroups argument must be an array')
    restriction.groups = restrictionGroups
  } else {
    if (group) {
      restriction.groups = [group]
    }
  }

  Roles.restrict(restriction)
  
  testUser(username, expectedRoles, group)
}

// -- unrestricted --

function testUnrestrictedUser (username, expectedRoles, group) {
  Roles._unrestrictConnection()
  Meteor.connection.setUserId(username)
  testUser(...arguments)
}

// -- from alanning:roles --

function testUser (username, expectedRoles, group) {
  var user = users[username]

  // l("[testUser]", user, expectedRoles, group)
  // test using user object rather than userId to avoid mocking
  _.each(roles, function (role) {
    const expected = _.contains(expectedRoles, role)
    const msg = username + ' expected to have \'' + role + '\' permission but does not'
    const nmsg = username + ' had un-expected permission ' + role

    const actual = Roles.userIsInRole(user, role, group)
    // l(role, expected, actual)
    if (expected) {
      expect(actual, msg).to.be.true
    } else {
      expect(actual, nmsg).to.be.false
    }
  })
}
