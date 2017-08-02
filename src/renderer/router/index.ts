import Vue from 'vue';
import Router from 'vue-router';

import BrowserMainView from '../components/BrowserMainView.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'browser-main-view',
      component: BrowserMainView,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
