'use strict'

process.env.BABEL_ENV = 'main'

const os = require('os')
const path = require('path')
const { dependencies } = require('../package.json')
const webpack = require('webpack')

const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HappyPack = require('happypack')

const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })
function createHappyPlugin(id, loaders) {
  return new HappyPack({
    id: id,
    loaders: loaders,
    threadPool: happyThreadPool,
    verbose: false
  })
}

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = ['vue']

let mainConfig = {
  entry: {
    main: path.join(__dirname, '../src/main/index.ts')
  },
  externals: [
    /^electron-debug/,
    ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'happypack/loader?id=happy-ts'
        },
        include: [ path.join(__dirname, '../src') ],
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: {
          loader: 'happypack/loader?id=happy-eslint'
        },
        include: [ path.join(__dirname, '../src/main') ],
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        use: {
          loader: 'happypack/loader?id=happy-babel'
        },
        include: [ path.join(__dirname, '../src/main') ],
        exclude: /node_modules/
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist')
  },
  plugins: [
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 10000
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('../static/vendor-manifest.json')
    }),
    createHappyPlugin('happy-babel', [{
      loader: 'babel-loader',
      options: {
        cacheDirectory: true
      }
    }]),
    createHappyPlugin('happy-eslint', [{
      loader: 'eslint-loader',
      options: {
        formatter: require('eslint-friendly-formatter')
      }
    }]),
    createHappyPlugin('happy-ts', [{
      loader: 'ts-loader',
      options: {
        appendTsSuffixTo: [/\.vue$/],
        configFile: path.join(__dirname, '../src/tsconfig.json'),
        happyPackMode: true,
        transpileOnly: true
      }
    }]),
    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true,
      tsconfig: path.join(__dirname, '../src/tsconfig.json'),
      tslint: path.join(__dirname, '../tslint.json'),
      tslintAutoFix: false,
      vue: true
    }),
    new ForkTsCheckerNotifierWebpackPlugin({ title: 'Main Process', excludeWarnings: false })
  ],
  resolve: {
    alias: {
      'shared': path.join(__dirname, '../src/shared'),
      'vue$': 'vue/dist/vue.runtime.esm.js'
    },
    extensions: ['.ts', '.js', '.json']
  },
  target: 'electron-main'
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainConfig.mode = 'production'
} else {
  /**
   * Adjust mainConfig for development settings
   */
  mainConfig.mode = 'development'
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust mainConfig for e2e settings
 */
if (process.env.TEST_ENV === 'e2e') {
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"test"',
      'process.env.TEST_ENV': '"e2e"'
    })
  )
}

module.exports = mainConfig
