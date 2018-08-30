export default function (req) {
  switch (req) {
    case 'vue-router': return require('vue-router');
    case 'vuex': return require('vuex');
    case 'vue-i18n': return require('vue-i18n');
  }
  throw new Error(`cannot find module ${req}`);
}
