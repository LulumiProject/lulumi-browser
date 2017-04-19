const ncp = require('ncp').ncp;
const path = require('path');

ncp.limit = 16;

const config = {
  // Name of electron app
  // Will be used in production builds
  name: 'lulumi-browser',

  // Use ESLint (extends `airbnb`)
  // Further changes can be made in `.eslintrc.js`
  eslint: true,

  // webpack-dev-server port
  port: 9080,

  // electron-packager options
  // Docs: https://simulatedgreg.gitbooks.io/electron-vue/content/docs/building_your_app.html
  building: {
    arch: 'x64',
    asar: true,
    dir: path.join(__dirname, 'app'),
    icon: path.join(__dirname, 'app/icons/icon'),
    ignore: /^\/(src|index\.pug|icons)/,
    out: path.join(__dirname, 'builds'),
    overwrite: true,
    platform: process.env.PLATFORM_TARGET || 'all',
    afterCopy: [(buildPath, electronVersion, platform, arch, callback) => {
      ncp(path.join(__dirname, 'extensions'), path.join(buildPath, 'extensions'), (err) => {
        if (err) {
          return console.error(err);
        }
        console.log(`\nCopy\n"${path.join(__dirname, 'extensions')}"\nto\n"${path.join(buildPath, 'extensions')}"\nsuccessfully\n`);
        callback();
      });
    }],
  },
};

config.building.name = config.name;

module.exports = config;
