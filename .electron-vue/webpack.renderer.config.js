'use strict'

process.env.BABEL_ENV = 'renderer'

const os = require('os')
const path = require('path')
const { dependencies } = require('../package.json')
const webpack = require('webpack')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WriteFileWebpackPlugin = require('write-file-webpack-plugin')
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HappyPack = require('happypack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })
function createHappyPlugin(id, loaders) {
  return new HappyPack({
    id: id,
    loaders: loaders,
    threadPool: happyThreadPool,
    verbose: false
  })
}

function returnLess() {
  return [
    process.env.NODE_ENV !== 'production'
      ? 'vue-style-loader'
      : MiniCssExtractPlugin.loader,
    'css-loader',
    'less-loader'
  ]
}
function returnCss() {
  return [
    process.env.NODE_ENV !== 'production'
      ? 'vue-style-loader'
      : MiniCssExtractPlugin.loader,
    'css-loader'
  ]
}

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = ['vue']

let mainBrowserWindowConfig = {
  name: 'main-browser-window',
  devtool: '#cheap-module-eval-source-map',
  entry: {
    'main-browser-window': path.join(__dirname, '../src/renderer/mainBrowserWindow/main.ts')
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
        include: [ path.join(__dirname, '../src/shared'), path.join(__dirname, '../src/renderer/lib'), path.join(__dirname, '../src/renderer/mainBrowserWindow'), path.join(__dirname, '../src/renderer/api') ],
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: {
          loader: 'happypack/loader?id=happy-eslint'
        },
        include: [ path.join(__dirname, '../src/helper') ],
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: returnLess,
        include: [ path.join(__dirname, '../src/renderer/mainBrowserWindow') ]
      },
      {
        test: /\.css$/,
        use: returnCss,
        include: [
          path.join(__dirname, '../src/renderer/mainBrowserWindow'),
          path.join(__dirname, '../node_modules/element-ui/lib/theme-chalk'),
          path.join(__dirname, '../node_modules/iview/dist/styles'),
          path.join(__dirname, '../node_modules/modern-normalize'),
          path.join(__dirname, '../node_modules/vue-awesome/components')
        ]
      },
      {
        test: /\.html$/,
        use: [{
          loader: 'happypack/loader?id=happy-html'
        }]
      },
      {
        test: /\.js$/,
        use: {
          loader: 'happypack/loader?id=happy-babel'
        },
        include: [ path.join(__dirname, '../src/helper') ],
        exclude: /node_modules/
      },
      {
        test: /\.pug$/,
        use: [{
          loader: 'happypack/loader?id=happy-pug'
        }]
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader'
        },
        include: [
          path.join(__dirname, '../src/renderer/mainBrowserWindow'),
          path.join(__dirname, '../node_modules/iview/src/components/icon'),
          path.join(__dirname, '../node_modules/vue-awesome/components')
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]'
          }
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name]--[folder].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]'
          }
        },
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new OptimizeCssAssetsPlugin({
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: false
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, '../src/renderer/mainBrowserWindow/index.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      cspPlugin: {
        enabled: process.env.NODE_ENV === 'production',
        policy: {
          'base-uri': "'self'",
          'default-src': "'none'",
          'object-src': "'self'",
          'connect-src': ["'self'"],
          // https://github.com/GoogleChromeLabs/comlink/pull/274
          'script-src': ["'self'", "'unsafe-eval'"],
          'style-src': ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
          'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
          'img-src': ["'self'", "https:", "http:", "data:"],
          'worker-src': ["'self'"]
        },
        nonceEnabled: {
          'style-src': false,
        },
      },
      nodeModules: process.env.NODE_ENV !== 'production'
        ? path.join(__dirname, '../node_modules')
        : false
    }),
    new CspHtmlWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
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
    createHappyPlugin('happy-html',  [{
      loader: 'vue-html-loader'
    }]),
    createHappyPlugin('happy-pug', [{
      loader: 'pug-plain-loader'
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
    // https://github.com/amireh/happypack/pull/131
    new HappyPack({
      loaders: [{
        path: 'vue-loader',
        query: {
          loaders: {
            pug: 'pug-plain-loader'
          }
        }
      }]
    }),
    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true,
      tsconfig: path.join(__dirname, '../src/tsconfig.json'),
      tslint: path.join(__dirname, '../tslint.json'),
      tslintAutoFix: false,
      vue: true
    }),
    new ForkTsCheckerNotifierWebpackPlugin({ title: 'Renderer Process [mainBrowserWindow]', excludeWarnings: false }),
    new VueLoaderPlugin(),
    new CopyWebpackPlugin([{
      from: 'src/helper/',
      to: path.join(__dirname, '../dist'),
      toType: 'dir'
    }])
  ],
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist')
  },
  resolve: {
    alias: {
      'src': path.join(__dirname, '../src'),
      'components': path.join(__dirname, '../src/renderer/mainBrowserWindow/components'),
      'renderer': path.join(__dirname, '../src/renderer/mainBrowserWindow'),
      'shared': path.join(__dirname, '../src/shared'),
      'i18n': path.join(__dirname, '../src/helper/i18n'),
      'extensions': path.join(__dirname, '../extensions'),
      'vue$': 'vue/dist/vue.runtime.esm.js'
    },
    extensions: ['.ts', '.js', '.vue', '.json', '.css', '.less', '.pug']
  },
  target: 'electron-renderer'
}

let preloadsConfig = {
  name: 'preloads',
  devtool: '#cheap-module-eval-source-map',
  entry: {
    'webview-preload': path.join(__dirname, '../src/preloads/webview-preload.ts'),
    'extension-preload': path.join(__dirname, '../src/preloads/extension-preload.ts'),
    'popup-preload': path.join(__dirname, '../src/preloads/popup-preload.ts')
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
        include: [ path.join(__dirname, '../src/preload'), path.join(__dirname, '../src/renderer/api') ],
        exclude: /node_modules/
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 10000
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('../static/vendor-manifest.json')
    }),
    createHappyPlugin('happy-ts', [{
      loader: 'ts-loader',
      options: {
        appendTsSuffixTo: [/\.vue$/],
        configFile: path.join(__dirname, '../src/tsconfig.json'),
        happyPackMode: true,
        transpileOnly: true
      }
    }]),
    new WriteFileWebpackPlugin({
      test: /-preload\.js$/
    }),
    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true,
      tsconfig: path.join(__dirname, '../src/tsconfig.json'),
      tslint: path.join(__dirname, '../tslint.json'),
      tslintAutoFix: false,
      vue: true
    }),
    new ForkTsCheckerNotifierWebpackPlugin({ title: 'Renderer Process [preloads]', excludeWarnings: false })
  ],
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist')
  },
  resolve: {
    alias: {
      'src': path.join(__dirname, '../src'),
      'extensions': path.join(__dirname, '../extensions'),
      'vue$': 'vue/dist/vue.runtime.esm.js'
    },
    extensions: ['.ts', '.js']
  },
  target: 'electron-renderer'
}

let preferenceViewConfig = {
  name: 'preference-view',
  devtool: '#cheap-module-eval-source-map',
  entry: {
    'preference-view': path.join(__dirname, '../src/renderer/preferenceView/main.ts')
  },
  externals: [
    ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'happypack/loader?id=happy-ts'
        },
        include: [ path.join(__dirname, '../src/renderer/lib'), path.join(__dirname, '../src/renderer/preferenceView') ],
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: returnLess,
        include: [ path.join(__dirname, '../src/renderer/preferenceView') ]
      },
      {
        test: /\.css$/,
        use: returnCss,
        include: [
          path.join(__dirname, '../src/renderer/preferenceView'),
          path.join(__dirname, '../node_modules/element-ui/lib/theme-chalk'),
          path.join(__dirname, '../node_modules/modern-normalize'),
          path.join(__dirname, '../node_modules/vue-awesome/components')
        ]
      },
      {
        test: /\.html$/,
        use: [{
          loader: 'happypack/loader?id=happy-html'
        }]
      },
      {
        test: /\.pug$/,
        use: [{
          loader: 'happypack/loader?id=happy-pug'
        }]
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader'
        },
        include: [ path.join(__dirname, '../src/renderer/preferenceView') ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]'
          }
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name]--[folder].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]'
          }
        },
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new OptimizeCssAssetsPlugin({
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: false
    }),
    new HtmlWebpackPlugin({
      filename: 'about.html',
      template: path.join(__dirname, '../src/renderer/preferenceView/index.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      cspPlugin: {
        enabled: process.env.NODE_ENV === 'production',
        policy: {
          'default-src': "'none'",
          'object-src': "'none'",
          'connect-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'font-src': ["'self'", "data:"],
          'img-src': ["'self'", "https:", "http:", "data:"]
        },
        nonceEnabled: {
          'style-src': false,
        },
      },
      nodeModules: false
    }),
    new CspHtmlWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 10000
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('../static/vendor-manifest.json')
    }),
    createHappyPlugin('happy-html',  [{
      loader: 'vue-html-loader'
    }]),
    createHappyPlugin('happy-pug', [{
      loader: 'pug-plain-loader'
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
    // https://github.com/amireh/happypack/pull/131
    new HappyPack({
      loaders: [{
        path: 'vue-loader',
        query: {
          loaders: {
            pug: 'pug-plain-loader'
          }
        }
      }]
    }),
    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true,
      tsconfig: path.join(__dirname, '../src/tsconfig.json'),
      tslint: path.join(__dirname, '../tslint.json'),
      vue: true
    }),
    new ForkTsCheckerNotifierWebpackPlugin({ title: 'Renderer Process [preferenceView]', excludeWarnings: false }),
    new VueLoaderPlugin()
  ],
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist')
  },
  resolve: {
    alias: {
      'components': path.join(__dirname, '../src/renderer/preferenceView/components'),
      'renderer': path.join(__dirname, '../src/renderer/preferenceView'),
      'i18n': path.join(__dirname, '../src/helper/i18n'),
      'vue$': 'vue/dist/vue.runtime.esm.js'
    },
    extensions: ['.ts', '.js', '.vue', '.json', '.css', '.less', '.pug']
  },
  target: 'web'
}

let searchWorkerConfig = {
  name: 'search-worker',
  devtool: '#cheap-module-eval-source-map',
  entry: {
    'search-worker': path.join(__dirname, '../src/renderer/mainBrowserWindow/js/search-worker.js')
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 10000
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('../static/vendor-manifest.json')
    })
  ],
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.join(__dirname, '../dist')
  },
  target: 'webworker'
}

/**
 * Adjust mainBrowserWindowConfig, preferenceViewConfig and preloadsConfig
 * for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainBrowserWindowConfig.mode = 'production'
  preloadsConfig.mode = 'production'
  preferenceViewConfig.mode = 'production'
  searchWorkerConfig.mode = 'production'
  // Because the target is 'web'. Ref: https://github.com/webpack/webpack/issues/6715
  preferenceViewConfig.performance = { hints: false }
  mainBrowserWindowConfig.devtool = false
  preloadsConfig.devtool = false
  preferenceViewConfig.devtool = false
  searchWorkerConfig.devtool = false

  mainBrowserWindowConfig.plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
  preloadsConfig.plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
  preferenceViewConfig.plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
  searchWorkerConfig.plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
} else {
  /**
   * Adjust mainBrowserWindowConfig, preferenceViewConfig and preloadsConfig
   * for development settings
   */
  mainBrowserWindowConfig.mode = 'development'
  preloadsConfig.mode = 'development'
  preferenceViewConfig.mode = 'development'
  searchWorkerConfig.mode = 'development'

  mainBrowserWindowConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
  preloadsConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
  preferenceViewConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust mainBrowserWindowConfig, preferenceViewConfig
 * and preloadsConfig for e2e settings
 */
if (process.env.TEST_ENV === 'e2e') {
  mainBrowserWindowConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"test"',
      'process.env.TEST_ENV': '"e2e"'
    })
  )
  preloadsConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"test"',
      'process.env.TEST_ENV': '"e2e"'
    })
  )
  preferenceViewConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"test"',
      'process.env.TEST_ENV': '"e2e"'
    })
  )
  searchWorkerConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"test"',
      'process.env.TEST_ENV': '"e2e"'
    })
  )
}

module.exports = [
  Object.assign({}, mainBrowserWindowConfig),
  Object.assign({}, preloadsConfig),
  Object.assign({}, preferenceViewConfig),
  Object.assign({}, searchWorkerConfig)
]
