export default [
  {
    path: '/',
    name: 'about-main',
    component: require('./components/AboutMainView'),
  },
  {
    path: '/lulumi',
    name: 'about-main-lulumi',
    component: require('./components/AboutMainView/Lulumi'),
  },
  {
    path: '/preferences',
    component: require('./components/AboutMainView/Preferences'),
    children: [
      {
        path: 'search',
        name: 'about-main-preferences-search-engine-provider',
        component: require('./components/AboutMainView/Preferences/SearchEngineProvider'),
      },
      {
        path: '',
        name: 'about-main-preferences',
        redirect: 'search',
      },
    ],
  },
  {
    path: '*',
    redirect: '/',
  },
];
