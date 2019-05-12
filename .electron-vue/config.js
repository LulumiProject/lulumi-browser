const path = require('path');

const config = {
  // Name of electron app
  // Will be used in production builds
  name: 'lulumi-browser',

  // Use ESLint (extends `airbnb`)
  // Further changes can be made in `.eslintrc.js`
  eslint: true,

  // express port
  port: 9080,

  // electron-packager options
  // https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-packager.html
  building: {
    arch: 'x64',
    asar: {
      unpackDir: 'static',
    },
    dir: path.resolve(__dirname, '../'),
    icon: path.resolve(__dirname, '../build/icons/icon'),
    ignore: /(^\/(src|test|build|extensions|userData|tslint|\.\w+|README|yarn))|\.gitkeep/,
    out: path.resolve(__dirname, '../builds'),
    overwrite: true,
    platform: process.env.BUILD_TARGET || 'all',
  },
};

config.building.name = config.name;

module.exports = config;
