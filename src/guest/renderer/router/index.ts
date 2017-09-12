import Vue from 'vue';
import Router from 'vue-router';

/* tslint:disable */
const AboutMainView = () =>
  import(/* webpackChunkName: "route-about-main-view" */ '../components/AboutMainView.vue');
const Lulumi = () =>
  import(/* webpackChunkName: "route-lulumi" */ '../components/AboutMainView/Lulumi.vue');
const Preferences = () =>
  import(/* webpackChunkName: "route-preferences" */ '../components/AboutMainView/Preferences.vue');
const SearchEngineProvider = () =>
  import(/* webpackChunkName: "route-search-engine-provider" */ '../components/AboutMainView/Preferences/SearchEngineProvider.vue');
const Homepage = () =>
  import(/* webpackChunkName: "route-homepage" */ '../components/AboutMainView/Preferences/Homepage.vue');
const PDFViewer = () =>
  import(/* webpackChunkName: "route-pdf-viewer" */ '../components/AboutMainView/Preferences/PDFViewer.vue');
const TabConfig = () =>
  import(/* webpackChunkName: "route-tab-config" */ '../components/AboutMainView/Preferences/TabConfig.vue');
const Language = () =>
  import(/* webpackChunkName: "route-language" */ '../components/AboutMainView/Preferences/Language.vue');
const Downloads = () =>
  import(/* webpackChunkName: "route-downloads" */ '../components/AboutMainView/Downloads.vue');
const History = () =>
  import(/* webpackChunkName: "route-history" */ '../components/AboutMainView/History.vue');
const Extensions = () =>
  import(/* webpackChunkName: "route-extensions" */ '../components/AboutMainView/Extensions.vue');
const Newtab = () =>
  import(/* webpackChunkName: "route-newtab" */ '../components/AboutMainView/Newtab.vue');

Vue.use(Router);

// TODO: https://github.com/vuejs/vue-router/pull/1619
export default new (Router as any)({
  routes: [
    {
      path: '/',
      name: 'about-main-view',
      component: AboutMainView,
    },
    {
      path: '/lulumi',
      name: 'lulumi',
      component: Lulumi,
    },
    {
      path: '/preferences',
      component: Preferences,
      children: [
        {
          path: 'search',
          name: 'search-engine-provider',
          component: SearchEngineProvider,
        },
        {
          path: 'homepage',
          name: 'homepage',
          component: Homepage,
        },
        {
          path: 'pdfViewer',
          name: 'pdfViewer',
          component: PDFViewer,
        },
        {
          path: 'tab',
          name: 'tab-config',
          component: TabConfig,
        },
        {
          path: 'language',
          name: 'language',
          component: Language,
        },
        {
          path: '',
          name: 'preferences',
          component: Preferences,
          redirect: 'search',
        },
      ],
    },
    {
      path: '/downloads',
      name: 'downloads',
      component: Downloads,
    },
    {
      path: '/history',
      name: 'history',
      component: History,
    },
    {
      path: '/extensions',
      name: 'extensions',
      component: Extensions,
    },
    {
      path: '/newtab',
      name: 'newtab',
      component: Newtab,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
