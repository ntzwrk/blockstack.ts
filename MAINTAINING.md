# Maintaining

This repository uses [`yarn`](https://yarnpkg.com/en/docs/getting-started) to manage NPM-related things.

## Releasing a new version

The releases should follow [Semantic Versioning](https://semver.org).

```bash
git flow release start <version>                                # Start new git-flow release
nano package.json && git commit -m "Bump version to <version>"  # Bump version in `package.json`
yarn document && git commit -m "Update code documentation"      # Re-generate code documentation
git flow release finish                                         # Finalize git-flow release
git push --all && git push --tags                               # Push all branches and tags
yarn publish                                                    # Publish the release to NPM
```

Also don't forget to [add a new release](https://github.com/ntzwrk/blockstack.ts/releases/new) in the repository itself.


### Release checklist

* [ ] Builds successfully
* [ ] Tests (and integration tests) run through
* [ ] Generated documentation
* [ ] Updated the changelog
* [ ] Checked/updated old ressources (examples, tutorials, etc)
* [ ] Pushed version to NPM
* [ ] Added new release on GitHub
* [ ] Closed issues resolved by this release
