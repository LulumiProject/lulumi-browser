import Vue from 'vue';
import Router from 'vue-router';

import AboutMainView from '../components/AboutMainView.vue';
import Lulumi from '../components/AboutMainView/Lulumi.vue';
import Preferences from '../components/AboutMainView/Preferences.vue';
import SearchEngineProvider from '../components/AboutMainView/Preferences/SearchEngineProvider.vue';
import Homepage from '../components/AboutMainView/Preferences/Homepage.vue';
import PDFViewer from '../components/AboutMainView/Preferences/PDFViewer.vue';
import TabConfig from '../components/AboutMainView/Preferences/TabConfig.vue';
import Language from '../components/AboutMainView/Preferences/Language.vue';
import Proxy from '../components/AboutMainView/Preferences/Proxy.vue';
import Auth from '../components/AboutMainView/Preferences/Auth.vue';
import Downloads from '../components/AboutMainView/Downloads.vue';
import History from '../components/AboutMainView/History.vue';
import Extensions from '../components/AboutMainView/Extensions.vue';
import Newtab from '../components/AboutMainView/Newtab.vue';

Vue.use(Router);

export default new Router({
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
          path: 'proxy',
          name: 'proxy',
          component: Proxy,
        },
        {
          path: 'auth',
          name: 'auth',
          component: Auth,
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
