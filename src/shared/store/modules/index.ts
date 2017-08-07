import Vuex from 'vuex';

interface RequireContext extends __WebpackModuleApi.RequireContext {
  default: object;
}

const files = require.context('.', false, /\.ts$/);
const modules: Vuex.ModuleTree<any> = {};

files.keys().forEach((key) => {
  if (key === './index.ts') return;
  modules[key.replace(/(\.\/|\.ts)/g, '')] = (files(key) as RequireContext).default;
});

export default modules;
