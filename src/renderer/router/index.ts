import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'browser-main',
      component: require('components/BrowserMainView.vue'),
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
