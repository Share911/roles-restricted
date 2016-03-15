var hook = Roles.onResumeAttemptCompleted
Roles.removeResumeAttemptCompletedHook(hook)

localStorage.getItem('Meteor.loginToken')


To test: 

```bash
git clone git@github.com:lorensr/roles-restricted.git
cd roles-restricted
meteor test-packages ./
open localhost:3000
```
