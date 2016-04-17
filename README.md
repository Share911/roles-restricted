Meteor package that adds a restricted-access state and autologin links to [alanning:roles](https://github.com/alanning/meteor-roles/).

The main use case is sending an email or sms to your user with a link to your app that contains an OTP (one-time password) that automatically logs them in (so they don't have to enter their username/password or do OAuth):

```
Josh Owens just commented on your blog post:
https://my-blog-app.com/post/abc?comment=3?token=A10F51nigkFsShxmvkLnlQ76Kzjh7h9pMuNxpVpO81a
```

If you want the user to be fully logged in, use the package [loren:login-links](https://github.com/lorensr/login-links.git). If you want the user to be temporarily logged in with restricted permissions, use this package. The login is temporary - it only lasts for the duration of the DDP connection (it uses [login-links connectionLogin](https://github.com/lorensr/login-links#connectionlogin)) - and is tab-specific (other tabs in the same browser will not be logged in unless they also have the token in the URL). You can use both packages together, as long as you use different type names and call `LoginLinks.setTypes` before `Roles.setRestrictionTypes`.

## Contents

- [Basic usage](#basic-usage)
  - [On server](#on-server)
  - [Then on client](#then-on-client)
- [Configuration](#configuration)
  - [Restrictions](#restrictions)
  - [Expiration](#expiration)
- [Changes to Roles package](#changes-to-roles-package)
- [Security note](#security-note)
- [API](#api)
  - [setRestrictionTypes](#setrestrictiontypes)
  - [generateRestrictedAccessToken](#generaterestrictedaccesstoken)
  - [restrictedLogin](#restrictedLogin)
  - [isInRoleWhenUnrestricted](#isinrolewhenunrestricted)
  - [Advanced](#advanced)
    - [onResumeAttemptCompleted](#onresumeattemptcompleted)
    - [removeResumeAttemptCompletedHook](#removeresumeattemptcompletedhook)
    - [isUnrestricted](#isunrestricted)
    - [restrict](#restrict)
- [Package dev](#package-dev)
  - [Testing](#testing)
- [Credits](#credits)
  
## Basic usage

1. Configure your restriction types.
1. Generate an access token.
1. Put it in a secure HTTPS URL and send it to the user via email, sms, etc.
1. When the user clicks the link, get the token from the URL and use it to log in the user.

### On server

```javascript
alice.roles // ['user', 'admin']

Roles.setRestrictionTypes({
  userOnly: {roles: ['user']}
});

token = Roles.generateRestrictedAccessToken(alice, {type: 'userOnly'});

Email.send({
  text: 'Click this: https://myapp.com/autologin/' + token,
  ...
});
```

You could also use the token for all your emails to users, adding it as a query parameter that works on any route:

`text: 'Josh Owens just commented on your post: https://myapp.com/anyroute?foo=bar&token=' + token`

### Then on client

```javascript
if (! Meteor.userId()) {
  token = get token from URL (depends on your router and link format)

  Roles.restrictedLogin(token, function(e, r) {
    if (!e) {
      alice = Meteor.user();
      Roles.userIsInRole(alice, ['user']); // true
      Roles.userIsInRole(alice, ['admin']); // false
    }
  });
}   
```

## Configuration

### Restrictions

You can configure restrictions using [types](#setrestrictiontypes) or on a [per-token basis](#generaterestrictedaccesstoken).

The roles a user has in a restricted state is the intersection of the restricted `roles` list you configure and their normal roles (`user.roles`). For example in the below scenario, the restricted user would only have the `user` role.

```javascript
// alice.roles is ['user', 'admin']

Roles.generateRestrictedAccessToken(alice, {roles: ['user', 'editor']});
```

### Expiration

When a login is attempted with a token that is expired, a `'login-links/token-expired'` error will be thrown. The default token expiration is one day. 

You can configure expiration in three ways:

- globally: `Roles.setDefaultExpirationInSeconds(60 * 60); // one hour` (call from both client and server)
- per [type](#setrestrictiontypes)
- per [token](#generaterestrictedaccesstoken)

## Changes to Roles package

The restricted roles are used for `Roles.userIsInRole(user, roles, [group])` when `user` is the logged-in user, as well as `Roles.getRolesForUser(user, [group])` and the `isInRole` UI helper. They are __not__ used for `getUsersInRole` or `getGroupsForUser` - those and all other functions remain unchanged from the base Roles package.

Restriction information is stored on the DDP connection. When you check roles inside of methods, it's easy for `roles-restricted` to access the connection. However, when you check roles outside of a method context, you must pass the context as a final parameter.

- `userIsInRole(user, roles, [group], [context])`
- `getRolesForUser(user, [group], [context]`

For instance inside of a publish function:

```javascript
Meteor.publish('data', function() {
  Roles.userIsInRole(user, ['editor'], null, this)
  Roles.userIsInRole(user, null, this)
})
```

If you don't have a publish context, then you can use `{unrestricted: true}` to do a check that assumes the user is unrestricted, or you can create an object to pass in:

```javascript
{
  userId: String
  connection: {
    _roles: {
      unrestricted: true
    }
    OR
    _roles: {
      restrictedRoles: {
        roles: ['user']
        group: 'group1'
      }
    }
  }
}
```

The roles will be restricted if `user` matches `context.userId` and `context.connection._roles.unrestricted` is not true.

## Security note

See [login-links security note](https://github.com/lorensr/login-links#security-note).

## API

### setRestrictionTypes

```javascript
Roles.setRestrictionTypes({
  typeName1: {
    roles: ['role1', 'role2', ...]
    group: 'group1' // if you use groups
    expirationInSeconds: 10 * 60 // optional
  },
  typeName2: ...
});

Roles.generateRestrictedAccessToken(alice, {type: 'typeName1'});
```

Using types is optional. If used, call from both server and client.

### generateRestrictedAccessToken

`Roles.generateRestrictedAccessToken(user, opts)` (server)

- `user`: `userId` or user object
- `opts`:
  - `type: String`
  - `roles: [String]`
  - `group: String` (if you use groups)
  - `expiresInSeconds: Integer` (optional)

`opts` must include either `type` or `roles`. 

### restrictedLogin

`Roles.restrictedLogin(token, cb)` (client)

See [login-links connectionLogin](https://github.com/lorensr/login-links#connectionlogin)

### isInRoleWhenUnrestricted

`{{isInRoleWhenUnrestricted role group}}` (client)

Template helper, analagous to [isInRole](http://alanning.github.io/meteor-roles/classes/UIHelpers.html), but ignores any current restriction.

### Advanced

- [onResumeAttemptCompleted](#onresumeattemptcompleted)
- [removeResumeAttemptCompletedHook](#removeresumeattemptcompletedhook)
- [isUnrestricted](#isunrestricted)
- [restrict](#restrict)

#### onResumeAttemptCompleted

`Roles.onResumeAttemptCompleted(cb)` (client)

The `cb` function is provided a boolean argument `loggedIn` (whether the resume attempt was successful).

In the basic example, we check `Meteor.userId()` at load time before doing a `restrictedLogin` - if the user is already logged in, we don't need to do a restricted login.

```javascript
if (! Meteor.userId())
  Roles.restrictedLogin(token, cb);
```

`Meteor.userId()` is optimistically set at pageload when Meteor is in the process of doing a resume login. In some cases - if the resume token has expired or been removed from the database (for instance by [Meteor.logoutOtherClients](http://docs.meteor.com/#/full/meteor_logoutotherclients)), then the resume login will fail, and `Meteor.userId()` will be set to null. To handle these cases, you can do the following:

```javascript
token = // get from URL

if (Meteor.userId()) {
  Roles.onResumeAttemptCompleted(function(loggedIn) {
    if (! loggedIn) 
      Roles.restrictedLogin(token, cb);
  });
} else {
  Roles.restrictedLogin(token, cb);
}  
```

#### removeResumeAttemptCompletedHook 

```javascript
var hook = Roles.onResumeAttemptCompleted(fn)
Roles.removeResumeAttemptCompletedHook(hook)
```

#### isUnrestricted

`Roles.isUnrestricted()`

See whether the current connection is in a restricted state or not.

#### restrict

`Roles.restrict(opts)`

`opts` must include either `type` or `roles`.

Manually place the connection in a restricted state. When called on server, it only applies to the server side of the connection. When called on the client, it is applied to both sides.

Note that this only lasts for the duration of the connection, so if they have a valid resume token (`localStorage.getItem('Meteor.loginToken')`), the user will be unrestricted on reconnect, on reload, or in other browser tabs.


## Package dev

ES6 without semicolons

### Testing

```bash
git clone git@github.com:lorensr/roles-restricted.git
cd roles-restricted
meteor test-packages ./
open localhost:3000
```

## Credits

Thanks to Share911 for sponsoring. [share911.com](https://share911.com/) - An emergency response system for your organization.

[Contributors](https://github.com/lorensr/roles-restricted/graphs/contributors)
