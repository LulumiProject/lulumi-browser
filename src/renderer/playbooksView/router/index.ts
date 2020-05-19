import Vue from 'vue';
import Router from 'vue-router';

import PlaybooksView from '../components/PlaybooksView.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'playbooks-view',
      component: PlaybooksView,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
