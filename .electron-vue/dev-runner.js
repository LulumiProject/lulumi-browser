'use strict'

const chalk = require('chalk')
const electron = require('electron')
const express = require('express')
const config = require('./config')
const path = require('path')
const { say } = require('cfonts')
const { spawn } = require('child_process')
const webpack = require('webpack')
const openInEditor = require('launch-editor-middleware')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const dllConfig = require('./webpack.dll.config')
const mainConfig = require('./webpack.main.config')
const Configs = require('./webpack.renderer.config')

let electronProcess = null
let manualRestart = false
let hotMiddleware = null

function logStats (proc, data) {
  let log = ''

  log += chalk.yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join('-')}`)
  log += '\n\n'

  if (typeof data === 'object') {
    data.toString({
      colors: true,
      chunks: false
    }).split(/\r?\n/).forEach(line => {
      log += '  ' + line + '\n'
    })
  } else {
    log += `  ${data}\n`
  }

  log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`) + '\n'

  console.log(log)
}

function startRenderer () {
  return new Promise((resolve, reject) => {
    Configs.forEach((config) => {
      if (config.name !== 'preloads') {
        Object.keys(config.entry).forEach(key => {
          config.entry[key] = [path.join(__dirname, `dev-client-${key}`)].concat(config.entry[key])
        });
      }
    })

    const app = express()
    const multiCompiler = webpack(Configs)
    const instance = webpackDevMiddleware(multiCompiler)
    hotMiddleware = webpackHotMiddleware(multiCompiler, {
      log: false,
      heartbeat: 2500
    });
    app.use(instance)
    instance.waitUntilValid(() => {
      resolve()
    })
    app.use(express.static(path.join(__dirname, '../', 'dist')));
    app.use('/static', express.static(path.join(__dirname, '../', 'static')));
    app.use(hotMiddleware)
    app.use('/__open-in-editor', openInEditor())

    multiCompiler.compilers.map(c => {
      if (c.name !== 'preloads') {
        c.hooks.compilation.tap('HtmlWebpackPlugin', compilation => {
          HtmlWebpackPlugin.getHooks(compilation).afterEmit.tapAsync('HtmlWebpackPluginAfterEmit', (data, cb) => {
            hotMiddleware.publish({ action: 'reload' })
            cb()
          })
        })
      }
    })

    multiCompiler.compilers.map(c => c.hooks.done.tap('done', stats => {
      logStats('Renderer', stats)
    }))

    app.listen(config.port, () => {
      console.log(`Listening on port ${config.port}`)
    })
  })
}

function startMain () {
  return new Promise((resolve, reject) => {
    mainConfig.entry.main = [path.join(__dirname, '../src/main/index.dev.ts')].concat(mainConfig.entry.main)

    const compiler = webpack(mainConfig)

    compiler.hooks.watchRun.tapAsync('watch-run', (compilation, done) => {
      logStats('Main', chalk.white.bold('compiling...'))
      hotMiddleware.publish({ action: 'compiling' })
      done()
    })

    compiler.watch({}, (err, stats) => {
      if (err) {
        console.log(err)
        return
      }

      logStats('Main', stats)

      if (electronProcess && electronProcess.kill) {
        manualRestart = true
        process.kill(electronProcess.pid)
        electronProcess = null
        startElectron()

        setTimeout(() => {
          manualRestart = false
        }, 5000)
      }

      resolve()
    })
  })
}

function startElectron () {
  electronProcess = spawn(electron, ['--inspect=9222', path.join(__dirname, '../dist/main.js')])
  electronProcess.stdout.on('data', data => {
    electronLog(data, 'blue')
  })
  electronProcess.stderr.on('data', data => {
    electronLog(data, 'red')
  })

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}

function electronLog (data, color) {
  let log = ''
  data = data.toString().split(/\r?\n/)
  data.forEach(line => {
    log += `  ${line}\n`
  })
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      chalk[color].bold('┏ Electron -------------------') +
      '\n\n' +
      log +
      chalk[color].bold('┗ ----------------------------') +
      '\n'
    )
  }
}

function greeting () {
  const cols = process.stdout.columns
  let text = ''

  if (cols > 104) text = 'lulumi-browser'
  else if (cols > 76) text = 'lulumi-|browser'
  else text = false

  if (text) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false
    })
  } else console.log(chalk.yellow.bold('\n  lulumi-browser'))
  console.log(chalk.blue('  getting ready...') + '\n')
}

function init () {
  greeting()

  const compiler = webpack(dllConfig)

  console.log('prebuild vendor.dll.js')
  compiler.watch({}, (err, stats) => {
    if (err) {
      console.log(err)
      return
    }

    logStats('Dll', stats)

    Promise.all([startRenderer(), startMain()])
      .then(() => {
        startElectron()
      })
      .catch(err => {
        console.error(err)
      })
  })
}

init()
