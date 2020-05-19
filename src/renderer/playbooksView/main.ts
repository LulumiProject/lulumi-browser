import Vue from 'vue';

import { Message } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import VueLogics from 'vue-logics';
import 'vue-logics/theme/default/logics.min.css';

import 'modern-normalize/modern-normalize.css';

import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';

Vue.use(VueLogics);

Vue.prototype.$message = Message;

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
