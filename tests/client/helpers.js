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
      Meteor.defer(cb)
    })
  })
}
