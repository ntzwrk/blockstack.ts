<p align="center">
  <br>

  <h3 align="center">blockstack.ts</h3>

  <p align="center">
    JavaScript / TypeScript library for interacting with Blockstack
    <br>
    <br>
    <a href="https://github.com/ntzwrk/blockstack.ts/blob/master/CONTRIBUTING.md">Contribute</a>
		&middot;
		<a href="https://github.com/ntzwrk/blockstack.ts/blob/master/examples/">Examples</a>
    &middot;
    <a href="https://ntzwrk.github.io/blockstack.ts/code/">Documentation</a>
    &middot;
    <a href="#quick-start">Quick start</a>
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/blockstack.ts"><img src="https://img.shields.io/npm/v/blockstack.ts.svg?style=flat-square" alt="npm"></a>
    <a href="https://github.com/ntzwrk/blockstack.ts/blob/master/LICENSE.md"><img src="https://img.shields.io/npm/l/blockstack.ts.svg?style=flat-square" alt="license"></a>
    <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square" alt="code style: prettier"></a>
    <a href="https://semver.org"><img src="https://img.shields.io/badge/sem-ver-lightgrey.svg?style=flat-square" alt="semver"></a>
    <a href="https://saythanks.io/to/vsund"><img src="https://img.shields.io/badge/say-thanks-1EAEDB.svg?style=flat-square" alt="say-thanks"></a>
  </p>
  <p align="center">
    <p align="center">
      <b>develop</b>
      <br>
   	  <a href="https://travis-ci.org/ntzwrk/blockstack.ts"><img src="https://img.shields.io/travis/ntzwrk/blockstack.ts/develop.svg?style=flat-square" alt="build for develop"></a>
      <a href="https://david-dm.org/ntzwrk/blockstack.ts/develop"><img src="https://img.shields.io/david/ntzwrk/blockstack.ts/develop.svg?style=flat-square" alt="dependencies for develop"></a>
    </p>
  </p>
  <p align="center">
    <p align="center">
      <b>master</b>
      <br>
   	  <a href="https://travis-ci.org/ntzwrk/blockstack.ts"><img src="https://img.shields.io/travis/ntzwrk/blockstack.ts/master.svg?style=flat-square" alt="build for master"></a>
    	<a href="https://david-dm.org/ntzwrk/blockstack.ts/master"><img src="https://img.shields.io/david/ntzwrk/blockstack.ts/master.svg?style=flat-square" alt="dependencies for master"></a>
    </p>
  </p>
</p>

<br>



## About
`blockstack.ts` is a library for interacting with Blockstack (i.e. [identity](#identity), [authentication](#authentication) and [storage](#storage)).

It's a fork of Blockstack's official [`blockstack.js`](https://github.com/blockstack/blockstack.js) library but got ported to [TypeScript](http://www.typescriptlang.org). Since TypeScript compiles to JavaScript, you can use this library in both languages without limitations.


## Installation
Simply install it with `yarn install blockstack.ts` into your project.

_Please note that the version on NPM is **just a placeholder** and doesn't contain any useful code._


## Quick start

### Identity
`@todo`

### Authentication
`@todo`

### Storage
`@todo`

### Zone files
```typescript
import { NameZoneFile } from 'blockstack.ts';
const zoneFile = await NameZoneFile.lookupByName('vsund.id');
console.log(zoneFile.profileTokenUrl);
```
<sub>[Full reference for `NameZoneFile`](@todo)</sub>

For more examples see [`examples/`](https://github.com/ntzwrk/blockstack.ts/blob/master/examples/).


## Documentation
The code documentation lives in `docs/code/`. You can find a live version at https://ntzwrk.github.io/blockstack.ts/code/.

_Please note that this code reference represents the state of the last release. Also if you're a developer using this library, you probably want to take a look at the [quick start](#quick-start) section and the documentation linked there._


## Contributing
You're want to contribute something? Thanks for considering!

You're looking for something to contribute on? Please review the [issues labeled with `help-wanted`](https://github.com/ntzwrk/blockstack.ts/labels/help-wanted).

You're wanting to contribute functionality? Have a look at the [requested features](https://github.com/ntzwrk/blockstack.ts/projects/3). Though please open an issue before starting to write code; would be a pity to throw away carefully written code just because of misunderstandings.

You're not sure yet what to contribute but definitely want to help with something? Add [this repository on Code Triage](https://www.codetriage.com/ntzwrk/blockstack.ts).

See [`CONTRIBUTING.md`](https://github.com/ntzwrk/blockstack.ts/blob/master/CONTRIBUTING.md) for a more complete guide on how to contribute to this library.


## Maintaining
See [`MAINTAINING.md`](https://github.com/ntzwrk/blockstack.ts/blob/master/MAINTAINING.md) for a guide on how to maintain this library.


## License
This code is published under the [MIT License](https://github.com/ntzwrk/blockstack.ts/blob/master/LICENSE.md).
