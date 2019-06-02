import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'

describe('roles-restricted', function () {
  it('throws context error', function (done) {
    const fn = function () {
      Roles.determineRoles('foo')
    }
    Meteor.defer(function() {
      expect(fn).to.throw()
      done()
    })
  })
})
