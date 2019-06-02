// Place on `window` so you can access in browser console
window.Meteor = Meteor
window.Roles = Roles

window.serverinfo = function() {
  Meteor.call('whoami', function(e, r) {
    l('userId: ', r);
  })
  Meteor.call('serverConnId', function(e, r) {
    l('connId: ', r);
  })
  Meteor.call('roles', function(e, r) {
    l('roles: ', r);
  })
}

login = function(cb){
  Meteor.logout()
  Meteor.call('cleardb', function(){
    l('createUser')
    Accounts.createUser({
      email: 'a@b',
      password: 'a'
    }, function(){
      // wait for unrestriction to occur
      Meteor.setTimeout(cb, 300)
    })
  })
}

/**
 * Compare simple array contents (strings, numbers)
 */
export function arraysEqual (arr1, arr2) {
  if (!arr1 || !arr2) {
    return false
  }
  if (arr1.length !== arr2.length) {
    return false
  }
  for (let i = 0, len = arr1.length; i < len; i++) {
    const elem1 = arr1[i]
    const elem2 = arr2[i]
    if (elem1 !== elem2) {
      return false
    }
  }
  return true
}
