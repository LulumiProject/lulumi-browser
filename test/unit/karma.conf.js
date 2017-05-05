'use strict'

const path = require('path')
const merge = require('webpack-merge')
const webpack = require('webpack')

const baseConfig = require('../../.electron-vue/webpack.renderer.config')
let webpackConfigs = new Array(baseConfig.length === undefined ? 1 : baseConfig.length)
webpackConfigs.fill('object');
const projectRoot = path.resolve(__dirname, '../../src/renderer')

// Set BABEL_ENV to use proper preset config
process.env.BABEL_ENV = 'test'

webpackConfigs.forEach((_, index) => {
  webpackConfigs[index] = merge(baseConfig[index], {
    devtool: '#inline-source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"testing"'
      })
    ]
  })

  // don't treat dependencies as externals
  delete webpackConfigs[index].entry
  delete webpackConfigs[index].externals
  delete webpackConfigs[index].output.libraryTarget

  // only apply babel for test files when using isparta
  webpackConfigs[index].module.rules.some(rule => {
    if (rule.use === 'babel-loader') {
      rule.include.push(path.resolve(projectRoot, '../test/unit'))
      return true
    }
  })

  // apply vue option to apply isparta-loader on js
  webpackConfigs[index].module.rules
    .find(rule => rule.use.loader === 'vue-loader').use.options.loaders.js = 'babel-loader'
})

module.exports = config => {
  config.set({
    browsers: ['visibleElectron'],
    client: {
      useIframe: false
    },
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    },
    customLaunchers: {
      'visibleElectron': {
        base: 'Electron',
        flags: ['--show']
      }
    },
    frameworks: ['mocha', 'chai'],
    files: ['./index.js'],
    preprocessors: {
      './index.js': ['webpack', 'sourcemap']
    },
    reporters: ['spec', 'coverage'],
    singleRun: true,
    webpack: webpackConfigs,
    webpackMiddleware: {
      noInfo: true
    }
  })
}
