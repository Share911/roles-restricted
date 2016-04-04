# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.1.2] - 2016-04-04
### Fix
- server-side didn't check userId correctly, so `getRolesForUser` was coming back empty

## [0.1.1] - 2016-04-04
### Added
- add `unrestricted` option to `userIsInRole(user, roles, group, {unrestricted: true}`

## [0.1.0] - 2016-04-03
Initial release
