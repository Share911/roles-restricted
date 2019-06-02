l = function(){
  console.log(...arguments)
}

Meteor.methods({
  setRestrictionTypes(types) {
    Roles.setRestrictionTypes(types)
  }
})
