export default [
  {
    path: '/',
    name: 'about-about',
    component: require('./components/about/About'),
  },
  {
    path: '/lulumi',
    name: 'about-lulumi',
    component: require('./components/about/Lulumi'),
  },
  {
    path: '/preferences',
    name: 'about-preferences',
    component: require('./components/about/Preferences'),
  },
  {
    path: '*',
    redirect: '/',
  },
];
