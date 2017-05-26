import Vue from 'vue';
import ElementUI from 'element-ui';

import App from 'renderer/App';

import router from 'renderer/router';
import store from 'renderer/store';

/* eslint-disable no-unused-expressions */

Vue.prototype.$t = () => {};
Vue.use(ElementUI);

Vue.config.productionTip = false;
Vue.config.devtools = false;

const config = {
  lulumiPagesCustomProtocol: 'lulumi://',
};

const about = {
  lulumi: [],
  about: [
    [`${config.lulumiPagesCustomProtocol}about/#/about`, 'about'],
    [`${config.lulumiPagesCustomProtocol}about/#/lulumi`, 'lulumi'],
    [`${config.lulumiPagesCustomProtocol}about/#/preferences`, 'preferences'],
    [`${config.lulumiPagesCustomProtocol}about/#/downloads`, 'downloads'],
    [`${config.lulumiPagesCustomProtocol}about/#/history`, 'history'],
    [`${config.lulumiPagesCustomProtocol}about/#/extensions`, 'extensions'],
  ],
};

let vm;
describe('App.vue', () => {
  before(async () => {
    const Ctor = Vue.extend(App);
    vm = new Ctor({
      el: document.createElement('div'),
      router,
      store,
    }).$mount();
    vm.$store.dispatch('updateAbout', about);
    await vm.$nextTick();
  });

  describe('about/#/about', () => {
    it('has 6 lists', () => {
      expect(vm.$el.querySelectorAll('li').length).to.equal(6);
    });
  });

  describe('about/#/lulumi', () => {
    before(async () => {
      vm.$router.replace({ path: '/lulumi' });
      await vm.$nextTick();
    });
    after(async () => {
      vm.$router.replace({ path: '/' });
      await vm.$nextTick();
    });

    it('exists an element, and its id is \'lulumi-name\'', () => {
      expect(vm.$el.querySelector('#lulumi-name')).to.exist;
    });
  });

  describe('about/#/newtab', () => {
    before(async () => {
      vm.$router.replace({ path: '/newtab' });
      await vm.$nextTick();
    });
    after(async () => {
      vm.$router.replace({ path: '/' });
      await vm.$nextTick();
    });

    it('exists an element, and its id is \'newtab-name\'', () => {
      expect(vm.$el.querySelector('#newtab-name')).to.exist;
    });
  });
});
