import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'

addBadResumeToken = function() {
  localStorage.setItem('Meteor.loginToken', 'e10F51nigkFsShxmvkLnlQ76Kzjh7h9pMuNxpVpO8Va')
  localStorage.setItem('Meteor.userId', 'myid')
}

localStorage.clear()

describe('roles-restricted', function () {
  this.timeout(5000)

  context('onResume', function () {

    it('called on failure', function (done) {
      let hook = Roles.onResumeAttemptCompleted(function(loggedIn) {
        try {
          expect(loggedIn).to.equal(false)
          Roles.removeResumeAttemptCompletedHook(hook)
          done()
        } catch (ex) {
          done(ex)
        }
      })
      addBadResumeToken(false)
    })

    it('called on success', function(done) {
      login(function() {
        Meteor.disconnect()

        Roles.onResumeAttemptCompleted(function(loggedIn) {
          try {
            expect(loggedIn).to.equal(true)
            done()
          } catch (ex) {
            done(ex)
          }
        })

        Meteor.reconnect()
      })
    })

  })
})
