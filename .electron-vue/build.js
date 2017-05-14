'use strict'

process.env.NODE_ENV = 'production'

const { say } = require('cfonts')
const chalk = require('chalk')
const del = require('del')
const fs = require('fs')
const packager = require('electron-packager')
const webpack = require('webpack')
const Multispinner = require('multispinner')

const buildConfig = require('./config').building
const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')

const doneLog = chalk.bgGreen.white(' DONE ') + ' '
const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgBlue.white(' OKAY ') + ' '

if (process.env.BUILD_TARGET === 'clean') clean()
else rev()

function clean () {
  del.sync(['builds/*', '!.gitkeep'])
  console.log(`\n${doneLog}${chalk.yellow('`builds`')} directory cleaned\n`)
  process.exit()
}

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
        } else build()
      });
    }
  })
}

function build () {
  say('lets-build', {
    font: 'simple3d',
    colors: ['yellow'],
    space: false
  })
  console.log()

  del.sync(['dist/*', '!.gitkeep'])

  const tasks = ['main', 'renderer']
  const m = new Multispinner(tasks, {
    preText: 'building',
    postText: 'process'
  })

  let results = ''

  m.on('success', () => {
    process.stdout.write('\x1B[2J\x1B[0f')
    console.log(`\n\n${results}`)
    console.log(`${okayLog}take it away ${chalk.yellow('electron-packager')}\n`)
    bundleApp()
  })

  pack(mainConfig).then(result => {
    results += result + '\n\n'
    m.success('main')
  }).catch(() => {
    m.error('main')
  })

  pack(rendererConfig).then(result => {
    results += result + '\n\n'
    m.success('renderer')
  }).catch(() => {
    m.error('renderer')
  })
}

function pack (config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)
      else if (stats.hasErrors()) reject(stats.toJson().errors)
      else {
        resolve(stats.toString({
          chunks: false,
          colors: true
        }))
      }
    })
  })
}

function bundleApp () {
  packager(buildConfig, (err, appPaths) => {
    if (err) {
      console.log(`\n${errorLog}${chalk.yellow('`electron-packager`')} says...\n`)
      console.log(err + '\n')
    } else {
      console.log(`${doneLog}building complete (builds/)\n`)
      console.log(appPaths)

      console.log('\n\x1b[34mDONE\n\x1b[0m')
    }
  })
}
