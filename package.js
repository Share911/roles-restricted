Package.describe({
  name: 'loren:roles-restricted',
  version: '0.1.0',
  summary: 'Adds restricted-access state and autologin links to alanning:roles',
  git: 'https://github.com/lorensr/roles-restricted.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');

  api.use(['ecmascript',
           'underscore',
           'accounts-base',
           'tracker',
           'reactive-var',
           'random',
           'alanning:roles@1.2.15'])

  api.export('Roles');

  api.addFiles('roles-restricted.js');
  api.addFiles(['server/loginHooks.js'], 'server');
  api.addFiles(['client/loginHooks.js'], 'client');
});

Package.onTest(function(api) {
  api.use(['ecmascript',
           'tinytest',
           'meteor-base',
           'accounts-password',
           'loren:roles-restricted']);

  api.addFiles(['tests/helpers.js'])

  api.addFiles(['tests/server/helpers.js'], 'server');

  api.addFiles(['tests/client/helpers.js',
                'tests/client/onResume.js'], 'client');
});
