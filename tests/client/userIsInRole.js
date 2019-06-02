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
  this.timeout(5000)

  context('restricted access', function () {

    it('can compare equal arrays', function () {
      expect(arraysEqual(['user'], ['user'])).to.be.true
    })
    it('can compare inequal arrays', function () {
      expect(arraysEqual(['user'], ['bar'])).to.be.false
    })

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

    it('restricted user is in role with Roles.GLOBAL_GROUP when no group given', function() {
      Roles.restrict({roles: ['user'], group: Roles.GLOBAL_GROUP})
      testUser('joe', ['user'])
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

function testRestrictedUser (username, expectedRoles, group) {
  Meteor.connection.setUserId(username)      

  restriction = {roles: ['user']}
  if (group)
    restriction.group = group

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
    var expected = _.contains(expectedRoles, role),
        msg = username + ' expected to have \'' + role + '\' permission but does not',
        nmsg = username + ' had un-expected permission ' + role

    const actual = Roles.userIsInRole(user, role, group)
    // l(role, expected, actual)
    if (expected) {
      expect(actual, msg).to.be.true
    } else {
      expect(actual, nmsg).to.be.false
    }
  })
}
