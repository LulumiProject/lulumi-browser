import Vue from 'vue';
import axios from 'axios';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-default/index.css';

import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';

(Vue as any).prototype.$http = axios;
(Vue as any).http = (Vue as any).prototype.$http;

Vue.use(ElementUI);

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
