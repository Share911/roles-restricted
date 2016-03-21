let roles = ['admin', 'editor', 'user']

let users = {
  'eve': {
    _id: 'eve',
    roles: ['admin', 'user']
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

function testRestrictedUser (test, username, expectedRoles, group) {
  Roles.restrict({roles: ['user']})
  testUser(test, username, expectedRoles, group)
}

Tinytest.add(
  'roles-restricted - can check if restricted user is in role',
  function (test) {
    testRestrictedUser(test, 'eve', ['user'])
  })

Tinytest.add(
  'roles-restricted - can check if restricted user is in role by group',
  function (test) {
    testRestrictedUser(test, 'bob', ['user'], 'group1')
    testRestrictedUser(test, 'bob', ['user'], 'group2')
    testRestrictedUser(test, 'bob', [], 'group3')
  })

Tinytest.add(
  'roles-restricted - can check if restricted user is in role with Roles.GLOBAL_GROUP',
  function (test) {
    testRestrictedUser(test, 'joe', ['user'])
    testRestrictedUser(test, 'joe', ['user'], Roles.GLOBAL_GROUP)
    testRestrictedUser(test, 'joe', ['user'], 'group1')
  })

Tinytest.add(
  'roles-restricted - defaults secure when no information on the connection',
  function (test) {
    // todo blank connection
    testRestrictedUser(test, 'eve', [])
  })
    
Tinytest.add(
  'roles-restricted - defaults secure when not logged in',
  function (test) {
    // todo connection without userId
    testRestrictedUser(test, 'eve', [])
  })


// -- unrestricted --

function testUnrestrictedUser () {
  Roles._unrestrictConnection()
  testUser(...arguments)
}

Tinytest.add(
  'roles-restricted - can check if user is in role',
  function (test) {
    testUnrestrictedUser(test, 'eve', ['admin', 'user'])
  })

Tinytest.add(
  'roles-restricted - can check if user is in role by group',
  function (test) {
    testUnrestrictedUser(test, 'bob', ['user'], 'group1')
    testUnrestrictedUser(test, 'bob', ['user', 'editor'], 'group2')
  })

Tinytest.add(
  'roles-restricted - can check if user is in role with Roles.GLOBAL_GROUP',
  function (test) {
    testUnrestrictedUser(test, 'joe', ['user', 'admin'])
    testUnrestrictedUser(test, 'joe', ['user', 'admin'], Roles.GLOBAL_GROUP)
    testUnrestrictedUser(test, 'joe', ['user', 'editor', 'admin'], 'group1')
  })


// -- from alanning:roles --

function testUser (test, username, expectedRoles, group) {
  var user = users[username]

  // test using user object rather than userId to avoid mocking
  _.each(roles, function (role) {
    var expected = _.contains(expectedRoles, role),
        msg = username + ' expected to have \'' + role + '\' permission but does not',
        nmsg = username + ' had un-expected permission ' + role

    l(role, expected)
    if (expected) {
      test.isTrue(Roles.userIsInRole(user, role, group), msg)
    } else {
      test.isFalse(Roles.userIsInRole(user, role, group), nmsg)
    }
  })
}

