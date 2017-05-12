import Vue from 'vue';
import axios from 'axios';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-default/index.css';

import App from './App';
import router from './router';
import store from './store';
import i18n from './i18n';

Vue.prototype.$http = axios;
Vue.http = Vue.prototype.$http;

Vue.use(ElementUI);

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

/* eslint-disable no-new */
new Vue({
  components: { App },
  i18n,
  router,
  store,
  template: '<App/>',
}).$mount('#app');
