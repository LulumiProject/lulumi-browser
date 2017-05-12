import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'about-main',
      component: require('renderer/components/AboutMainView'),
    },
    {
      path: '/lulumi',
      name: 'about-main-lulumi',
      component: require('renderer/components/AboutMainView/Lulumi'),
    },
    {
      path: '/preferences',
      component: require('renderer/components/AboutMainView/Preferences'),
      children: [
        {
          path: 'search',
          name: 'about-main-preferences-search-engine-provider',
          component: require('renderer/components/AboutMainView/Preferences/SearchEngineProvider'),
        },
        {
          path: 'homepage',
          name: 'about-main-preferences-homepage',
          component: require('renderer/components/AboutMainView/Preferences/Homepage'),
        },
        {
          path: 'pdfViewer',
          name: 'about-main-preferences-pdfViewer',
          component: require('renderer/components/AboutMainView/Preferences/PDFViewer'),
        },
        {
          path: 'tab',
          name: 'about-main-preferences-tab-config',
          component: require('renderer/components/AboutMainView/Preferences/TabConfig'),
        },
        {
          path: 'language',
          name: 'about-main-preferences-language',
          component: require('renderer/components/AboutMainView/Preferences/Language'),
        },
        {
          path: '',
          name: 'about-main-preferences',
          redirect: 'search',
        },
      ],
    },
    {
      path: '/downloads',
      name: 'about-main-downloads',
      component: require('renderer/components/AboutMainView/Downloads'),
    },
    {
      path: '/history',
      name: 'about-main-history',
      component: require('renderer/components/AboutMainView/History'),
    },
    {
      path: '/extensions',
      name: 'about-main-extensions',
      component: require('renderer/components/AboutMainView/Extensions'),
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
