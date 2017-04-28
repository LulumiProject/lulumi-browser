# Lulumi-browser

> Lulumi-browser is a light weight browser coded with Vue.js 2 and Electron.

<p align="center">
  <a href="http://i.imgur.com/bvmh77u.png" target="_blank">
    <img src="http://i.imgur.com/bvmh77u.png" width="700px">
  </a>
</p>

## Warning

### Currently, Lulumi-browser has only been tested on macOS, and might have some display problems on other platforms

## Build Setup

``` bash
# install dependencies
$ yarn

# serve with hot reload at localhost:9080
$ yarn run dev

# build electron app for all platforms
$ yarn run build

# build electron app for the specific target platform
$ yarn run build:darwin # macOS
$ yarn run build:linux  # Linux
$ yarn run build:mas    # Mac AppStore
$ yarn run build:win32  # Windows

# lint all JS/Vue component files in `app/src`
$ yarn run lint

# lint and fix
$ yarn run lint:fix

# test electron app for production
$ yarn run test
```

## API (experimental)

- lulumi
  * env: `appName(callback), appVersion(callback)`
  * browserAction: `onClicked`
  * pageAction: `show(tabId), hide(tabId), onClicked`
  * alarms: `get(name, callback), getAll(callback), clear(name, callback), clearAll(callback), create(name, alarmInfo), onAlarm`
  * commands: `onCommand`
  * runtime: `id, getURL(path), sendMessage(extensionId, message, options, responseCallback), onMessage`
  * tabs: `get(tabId, callback), getCurrent(callback), duplicate(tabId, callback), query(queryInfo, callback), update(tabId, updateProperties = {}, callback), reload(tabId, reloadProperties, callback), remove(tabIds, callback), detectLanguage(tabId, callback), executeScript(tabId, details, callback), insertCSS: (tabId, details, callback), sendMessage(tabId, message, responseCallback), onUpdated, onCreated, onRemoved`
  * storage: `local, sync, set(items, callback), get(keys, callback), onChanged`

---

This project was generated from [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[d4e52e7](https://github.com/SimulatedGREG/electron-vue/commit/d4e52e7596be6715f7e5e575c40066856ceeea0c) and developed by [@qazbnm456](https://github.com/qazbnm456).
