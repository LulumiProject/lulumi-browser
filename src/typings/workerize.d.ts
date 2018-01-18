declare module 'workerize-loader!*' {
  import { renderer, store } from 'lulumi';
  import VueI18n from 'vue-i18n';

  class Workerize {
    constructor();

    historyMappings(history: store.TabHistory[]): any;
  }

  // https://github.com/developit/workerize-loader/issues/3
  export default Workerize;
}
