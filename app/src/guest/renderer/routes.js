export default [
  {
    path: '/',
    name: 'about-about',
    component: require('./components/AboutMainView'),
  },
  {
    path: '/lulumi',
    name: 'about-lulumi',
    component: require('./components/AboutMainView/Lulumi'),
  },
  {
    path: '/preferences',
    name: 'about-preferences',
    component: require('./components/AboutMainView/Preferences'),
  },
  {
    path: '*',
    redirect: '/',
  },
];
