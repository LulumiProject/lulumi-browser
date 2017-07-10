import Vue from 'vue';
import Router from 'vue-router';

/* tslint:disable */
const BrowserMainView = () =>
  import(/* webpackChunkName: "route-browser-main-view" */ '../components/BrowserMainView.vue');

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
