'use strict'

process.env.BABEL_ENV = 'renderer'

const path = require('path')
const pkg = require('../package.json')
const settings = require('./config.js')
const webpack = require('webpack')

const BabiliWebpackPlugin = require('babili-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

let rendererConfig = {
  name: 'renderer',
  devtool: '#eval-source-map',
  entry: {
    renderer: path.join(__dirname, '../src/renderer/main.js')
  },
  externals: Object.keys(pkg.dependencies || {}).filter(d => !['vue'].includes(d)),
  module: {
    rules: [
      {
        test: /\.(less|css)$/,
        use: ExtractTextPlugin.extract({
          use: [{
            loader: "css-loader"
          }, {
            loader: "less-loader"
          }],
          fallback: "style-loader"
        })
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader'
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: [ path.resolve(__dirname, '../src/renderer'), path.resolve(__dirname, '../src/api'), path.resolve('../node_modules/vue-awesome') ],
        exclude: /node_modules(?![\\/]vue-awesome[\\/])/
      },
      {
        test: /\.json$/,
        use: 'json-loader'
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            loaders: {
              sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!sass-loader',
              less: 'vue-style-loader!css-loader!less-loader'
            },
          },
        },
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name].[ext]'
          }
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name].[ext]'
          }
        },
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name].css'),
    new FriendlyErrorsPlugin({
      clearConsole: false
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.pug'),
      nodeModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(__dirname, '../node_modules')
        : false
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist')
  },
  resolve: {
    alias: {
      'src': path.join(__dirname, '../src'),
      'components': path.join(__dirname, '../src/renderer/components'),
      'renderer': path.join(__dirname, '../src/renderer'),
      'i18n': path.join(__dirname, '../helper/i18n'),
      'extensions': path.join(__dirname, '../extensions'),
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['.js', '.vue', '.json', '.css', '.less', '.pug']
  },
  target: 'electron-renderer'
}

let aboutConfig = {
  name: 'about',
  devtool: '#eval-source-map',
  entry: {
    about: path.join(__dirname, '../src/guest/renderer/main.js')
  },
  externals: Object.keys(pkg.dependencies || {}).filter(d => !['vue'].includes(d)),
  module: {
    rules: [
      {
        test: /\.(less|css)$/,
        use: ExtractTextPlugin.extract({
          use: [{
            loader: "css-loader"
          }, {
            loader: "less-loader"
          }],
          fallback: "style-loader"
        })
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader'
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: [ path.resolve(__dirname, '../src/guest/renderer'), path.resolve('../node_modules/vue-awesome') ],
        exclude: /node_modules(?![\\/]vue-awesome[\\/])/
      },
      {
        test: /\.json$/,
        use: 'json-loader'
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            loaders: {
              sass: 'vue-style-loader!css-loader!less-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!less-loader!sass-loader',
              less: 'vue-style-loader!css-loader!less-loader'
            },
          },
        },
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name].[ext]'
          }
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name].[ext]'
          }
        },
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name].css'),
    new FriendlyErrorsPlugin({
      clearConsole: false
    }),
    new HtmlWebpackPlugin({
      filename: 'about.html',
      template: path.resolve(__dirname, '../src/guest/index.pug'),
      nodeModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(__dirname, '../node_modules')
        : false
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist')
  },
  resolve: {
    alias: {
      'components': path.join(__dirname, '../src/guest/renderer/components'),
      'renderer': path.join(__dirname, '../src/guest/renderer'),
      'i18n': path.join(__dirname, '../helper/i18n'),
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['.js', '.vue', '.json', '.css', '.less', '.pug']
  },
  target: 'web'
}

if (process.env.NODE_ENV !== 'production') {
  /**
   * Apply ESLint
   */
  if (settings.eslint) {
    rendererConfig.module.rules.push(
      {
        test: /\.(js|vue)$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter')
          }
        }
      }
    )
    aboutConfig.module.rules.push(
      {
        test: /\.(js|vue)$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter')
          }
        }
      }
    )
  }
}

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.devtool = ''
  aboutConfig.devtool = ''

  rendererConfig.plugins.push(
    new BabiliWebpackPlugin({
      removeConsole: true,
      removeDebugger: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
  aboutConfig.plugins.push(
    new BabiliWebpackPlugin({
      removeConsole: true,
      removeDebugger: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}

module.exports = [
  Object.assign({} , rendererConfig),
  Object.assign({} , aboutConfig)
]
