import Vue from 'vue';
import Resource from 'vue-resource';
import Router from 'vue-router';

import App from './App';
import routes from './routes';

Vue.use(Resource);
Vue.use(Router);

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

const router = new Router({
  mode: 'history',
  scrollBehavior: () => ({ y: 0 }),
  routes,
});

/* eslint-disable no-new */
new Vue({
  router,
  ...App,
  mounted() {
    if (window.data) {
      this.$store.dispatch('updateAbout', window.data);
    } else {
      // eslint-disable-next-line no-alert
      alert('error');
    }
  },
}).$mount('#app');
