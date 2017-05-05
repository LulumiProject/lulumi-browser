'use strict'

const exec = require('child_process').exec
const packager = require('electron-packager')
const fs = require('fs')

if (process.env.PLATFORM_TARGET === 'clean') {
  require('del').sync(['builds/*', '!.gitkeep'])
  console.log('\x1b[33m`builds` directory cleaned.\n\x1b[0m')
} else rev()

/**
 * Write rev info in production
 */
function rev() {
  console.log('\x1b[34mWriting rev into app(s)...\n\x1b[0m')
  const appConfig = require('path').resolve(__dirname ,'../src/renderer/js/constants/config.js')
  fs.readFile(appConfig, 'utf8', (err, data) => {
    if (err) {
      console.error(err)
    } else {
      const result = data.replace(/lulumiRev: ['a-z0-9]*,/, `lulumiRev: '${require('git-rev-sync').long('.')}',`)
      fs.writeFile(appConfig, result, 'utf8', (err) => {
        if (err) {
          console.error(err)
        } else pack()
      });
    }
  })
}

/**
 * Build webpack in production
 */
function pack () {
  console.log('\x1b[33mBuilding webpack in production mode...\n\x1b[0m')
  let pack = exec('yarn run pack', { maxBuffer: 500*1024 }) // default is 200*1024

  pack.stdout.on('data', data => console.log(data))
  pack.stderr.on('data', data => console.error(data))
  pack.on('exit', code => build())
}

/**
 * Use electron-packager to build electron app
 */
function build () {
  let options = require('./config').building

  console.log('\x1b[34mBuilding electron app(s)...\n\x1b[0m')
  packager(options, (err, appPaths) => {
    if (err) {
      console.error('\x1b[31mError from `electron-packager` when building app...\x1b[0m')
      console.error(err)
    } else {
      console.log('Build(s) successful!')
      console.log(appPaths)

      console.log('\n\x1b[34mDONE\n\x1b[0m')
    }
  })
}
