import Vue from 'vue';
import Router from 'vue-router';

import CPMainView from '../components/CPMainView.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'command-palette-main-view',
      component: CPMainView,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
