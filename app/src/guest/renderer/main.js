import Vue from 'vue';
import Resource from 'vue-resource';
import Router from 'vue-router';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-default/index.css';

import App from './App';
import routes from './routes';
import i18n from './i18n';

Vue.use(Resource);
Vue.use(Router);
Vue.use(ElementUI);

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

const router = new Router({
  mode: 'hash',
  scrollBehavior: () => ({ y: 0 }),
  routes,
});

/* eslint-disable no-new */
new Vue({
  i18n,
  router,
  ...App,
}).$mount('#app');
