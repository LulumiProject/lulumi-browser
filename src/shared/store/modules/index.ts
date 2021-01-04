import { ModuleTree } from 'vuex';

interface RequireContext extends __WebpackModuleApi.RequireContext {
  default: any;
}

const files = require.context('.', false, /\.ts$/);
const modules: ModuleTree<any> = {};

files.keys().forEach((key) => {
  if (key === './index.ts') return;
  modules[key.replace(/(\.\/|\.ts)/g, '')] = (files(key) as RequireContext).default;
});

export default modules;
