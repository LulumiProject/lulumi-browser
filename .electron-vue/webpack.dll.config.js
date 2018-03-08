const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    vendor: [
      'babel-polyfill',
      'collect.js',
      'fuse.js',
      'vue/dist/vue.esm.js',
      'vue-i18n',
      'vue-router',
      'vuex'
    ]
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader'
        }
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader'
        },
        exclude: /node_modules/
      }
    ]
  },
  output: {
    filename: '[name].dll.js',
    library: '[name]_library',
    path: path.join(__dirname, '../dist')
  },
  performance: { hints: false },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, '../static', '[name]-manifest.json'),
      name: '[name]_library'
    })
  ]
}
