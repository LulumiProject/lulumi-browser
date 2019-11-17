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
const dllConfig = require('./webpack.dll.config')
const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')

const doneLog = chalk.bgGreen.white(' DONE ') + ' '
const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgBlue.white(' OKAY ') + ' '
const isCI = process.env.CI || false

if (process.env.BUILD_TARGET === 'clean') clean()
else rev()

function clean () {
  del.sync(['builds/*', '!.gitkeep'])
  console.log(`\n${doneLog}\n`)
  process.exit()
}

/**
 * Write rev info in production
 */
function rev() {
  console.log('\x1b[34mWriting rev into app(s)...\n\x1b[0m')
  const constants = require('path').resolve(__dirname ,'../src/main/constants.ts')
  fs.readFile(constants, 'utf8', (err, data) => {
    if (err) {
      console.error(err)
    } else {
      try {
        const result = data.replace(/lulumiRev: ['a-z0-9]*,/, `lulumiRev: '${require('git-rev-sync').long('.')}',`)
        fs.writeFile(constants, result, 'utf8', (err) => {
          if (err) {
            console.error(err)
          } else build()
        });
      } catch (err) {
        console.error(err)
        fs.writeFile(constants, '0000000000000000000000000000000000000000', 'utf8', (err) => {
          if (err) {
            console.error(err)
          } else build()
        });
        build()
      }
    }
  })
}

function build () {
  greeting()

  del.sync(['dist/*', '!.gitkeep'])

  console.log('prebuild vendor.dll.js')
  webpack(dllConfig, (err, stats) => {
    if (err) {
      console.log(`\n  ${errorLog}failed to build vendor.dll.js`)
      console.error(`\n${err}\n`)
      process.exit(1)
    } else if (stats.hasErrors()) {
      let err = ''

      stats.toString({
        chunks: false,
        colors: true
      })
      .split(/\r?\n/)
      .forEach(line => {
        err += `    ${line}\n`
      })

      console.log(`\n  ${errorLog}failed to build vendor.dll.js`)
      console.error(`\n${err}\n`)
      process.exit(1)
    } else {
      console.log(`\n${okayLog}\n${stats.toString({
        chunks: false,
        colors: true
      })}\n`)

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
      }).catch(err => {
        m.error('main')
        console.log(`\n  ${errorLog}failed to build main process`)
        console.error(`\n${err}\n`)
        process.exit(1)
      })

      pack(rendererConfig).then(result => {
        results += result + '\n\n'
        m.success('renderer')
      }).catch(err => {
        m.error('renderer')
        console.log(`\n  ${errorLog}failed to build renderer process`)
        console.error(`\n${err}\n`)
        process.exit(1)
      })
    }
  })
}

function pack (config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)
      else if (stats.hasErrors()) {
        let err = ''

        stats.toString({
          chunks: false,
          colors: true
        })
        .split(/\r?\n/)
        .forEach(line => {
          err += `    ${line}\n`
        })

        reject(err)
      } else {
        resolve(stats.toString({
          chunks: false,
          colors: true
        }))
      }
    })
  })
}

function bundleApp () {
  packager(buildConfig)
    .then((appPaths) => {
      console.log(`\n${doneLog}\n`)
      console.log(appPaths)

      console.log('\n\x1b[34mDONE\n\x1b[0m')
    })
    .catch((err) => {
      console.log(`\n${errorLog}${chalk.yellow('`electron-packager`')} says...\n`)
      console.log(err + '\n')
    });
}

function greeting () {
  const cols = process.stdout.columns
  let text = ''

  if (cols > 85) text = 'lets-build'
  else if (cols > 60) text = 'lets-|build'
  else text = false

  if (text && !isCI) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false
    })
  } else console.log(chalk.yellow.bold('\n  lets-build'))
  console.log()
}
