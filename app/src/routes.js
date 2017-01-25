export default [
  {
    path: '/',
    name: 'browser-main',
    component: require('components/BrowserMain'),
  },
  {
    path: '*',
    redirect: '/',
  },
];
