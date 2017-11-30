import Vue from 'vue';
import { Message } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';

Vue.prototype.$message = Message;

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

new Vue({
  i18n,
  router,
  store,
  components: { App },
  template: '<App/>',
}).$mount('#app');
