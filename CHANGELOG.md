# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.1.6] - 2018-03-28
- Fix "Error: TypeError: undefined is not an object (evaluating 'r.roles[i.group]')"

## [0.1.5] - 2016-09-28
### Fixed
- Add check to avoid common error when first connecting (#2)

### Updated
- `login-links@0.1.3`

## [0.1.3] - 2016-05-02
### Added
- `isUnrestrictedFromPublish`

## [0.1.2] - 2016-04-04
### Fix
- server-side didn't check userId correctly, so `getRolesForUser` was coming back empty

## [0.1.1] - 2016-04-04
### Added
- add `unrestricted` option to `userIsInRole(user, roles, group, {unrestricted: true}`

## [0.1.0] - 2016-04-03
Initial release
