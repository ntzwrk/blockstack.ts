# Contributing

This repository uses [`git-flow`](https://nvie.com/posts/a-successful-git-branching-model/) in the [`gitflow-avh` edition](https://github.com/petervanderdoes/gitflow-avh) to organize development.

Please raise your PRs against the `develop` branch (regardless of `git-flow` usage).

Before raising a PR, please make sure that
* your code is lint-free (`yarn lint`),
* your code compiles (`yarn build`),
* the tests run through (`yarn test`).
Also don't forget to comment your code properly and add code documentation / tests.

Thanks for contributing!


## Best practices

* Please put your classes in ClassName.ts
* Please don't use default exports (see [this](https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html) and [this](https://blog.neufund.org/why-we-have-banned-default-exports-and-you-should-do-the-same-d51fdc2cf2ad))
