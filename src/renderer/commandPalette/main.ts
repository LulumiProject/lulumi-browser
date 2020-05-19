import Vue from 'vue';
import VueInputAutowidth from 'vue-input-autowidth';
import Electron from 'vue-electron';
import 'element-ui/lib/theme-chalk/index.css';
import 'modern-normalize/modern-normalize.css';

import App from './App.vue';
import router from './router';
import store from '../../shared/store/rendererStore';
import i18n from './i18n';

Vue.use(VueInputAutowidth);
Vue.use(Electron);

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

new Vue({
  i18n,
  router,
  store,
  name: 'Root',
  components: { App },
  render(h) {
    return h('App');
  },
}).$mount('#app');
