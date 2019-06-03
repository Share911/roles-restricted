Package.describe({
  name: 'share911:roles-restricted',
  version: '0.1.7',
  summary: 'Adds restricted-access state and autologin links to alanning:roles',
  git: 'https://github.com/lorensr/roles-restricted.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.8');

  api.use(['ecmascript',
           'underscore',
           'accounts-base',
           'tracker',
           'check',
           'reactive-var',
           'random',
           'ddp',
           'lamhieu:unblock@0.1.0',
           'loren:login-links@0.1.3',
           'alanning:roles@1.2.15'])

  api.export('Roles');

  api.addFiles(['common/roles-restricted.js',
                'common/roles_overwrites.js']);

  api.addFiles(['server/roles-restricted.js',
                'server/connectionLogin.js',
                'server/restrictedAccessToken.js',
                'server/loginHooks.js'], 'server');

  api.addFiles(['client/roles-restricted.js',
                'client/templateHelpers.js',
                'client/loginHooks.js'], 'client');
});

Package.onTest(function(api) {
  api.use([
    'jquery',
    'ecmascript',
    'meteor-base',
    'accounts-password',
    'share911:roles-restricted',
    'meteortesting:mocha',
    'practicalmeteor:chai',
  ])

  api.addFiles(['tests/helpers.js'])

  api.addFiles(['tests/server/helpers.js',
                'tests/server/determineRoles.js'], 'server');

  api.addFiles(['tests/client/helpers.js',
                'tests/client/restrictedLogin.js',
                'tests/client/userIsInRole.js',
                'tests/client/loginHooks.js',
                'tests/client/onResume.js'], 'client');
});
