# Lulumi-browser [![Dependencies Status](https://david-dm.org/LulumiProject/lulumi-browser/status.svg)](https://david-dm.org/LulumiProject/lulumi-browser) [![devDependencies Status](https://david-dm.org/LulumiProject/lulumi-browser/dev-status.svg)](https://david-dm.org/LulumiProject/lulumi-browser?type=dev)

> Lulumi-browser is a lightweight browser coded with Vue.js 2 and Electron.

<p align="center">
  <img alt="Lulumi-browser" src="https://i.imgur.com/5mO19u7.jpg" width="700px">
</p>

If you like this and would like to support it. Check out my [patreon page](https://www.patreon.com/boik) :)<br>And don't forget to check out my [repos](https://github.com/qazbnm456) 🐾 or say *hi* on my [Twitter](https://twitter.com/qazbnm456) as well!

## Build Setup

``` bash
# install dependencies
$ yarn install --ignore-engines

# prebuild the vendor.dll.js, which is a must-have file that will be used across main.js, renderer.js, and about.js.
$ yarn run build:dll

# serve with hot reload at localhost:9080
$ yarn run dev

# build electron applications for all platforms
$ yarn run build

# build the electron application for the specific target platform
$ yarn run build:darwin # macOS
$ yarn run build:linux  # Linux
$ yarn run build:mas    # Mac AppStore
$ yarn run build:win32  # Windows

# lint all JS/Vue component files in `src/`
$ yarn run lint

# lint and fix
$ yarn run lint:fix

# test the electron application for production
$ yarn run test
```

## API support (experimental)

- https://github.com/LulumiProject/lulumi-browser/issues/19

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](code-of-conduct.md). By participating in this project you agree to abide by its terms.

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[1c165f7](https://github.com/SimulatedGREG/electron-vue/commit/1c165f7c5e56edaf48be0fbb70838a1af26bb015) and developed by [@qazbnm456](https://github.com/qazbnm456).
