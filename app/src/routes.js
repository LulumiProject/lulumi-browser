export default [
  {
    path: '/',
    name: 'browser-main',
    component: require('components/BrowserMainView'),
  },
  {
    path: '*',
    redirect: '/',
  },
];
