import Vue from 'vue';
import ElementUI from 'element-ui';

import AboutMainView from 'components/AboutMainView';

import router from 'renderer/router';
import store from 'renderer/store';

Vue.prototype.$t = () => {};
Vue.use(ElementUI);

Vue.config.productionTip = false;
Vue.config.devtools = false;

const config = {
  lulumiPagesCustomProtocol: 'lulumi://',
};

const about = {
  about: [
    [`${config.lulumiPagesCustomProtocol}about/#/about`, 'about'],
    [`${config.lulumiPagesCustomProtocol}about/#/lulumi`, 'lulumi'],
    [`${config.lulumiPagesCustomProtocol}about/#/preferences`, 'preferences'],
    [`${config.lulumiPagesCustomProtocol}about/#/downloads`, 'downloads'],
    [`${config.lulumiPagesCustomProtocol}about/#/history`, 'history'],
    [`${config.lulumiPagesCustomProtocol}about/#/extensions`, 'extensions'],
  ],
};

describe('AboutMainView.vue', () => {
  it('have 6 lists', (done) => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(AboutMainView),
      router,
      store,
    }).$mount();
    vm.$store.dispatch('updateAbout', about);

    vm.$nextTick(() => {
      expect(vm.$el.querySelectorAll('li').length).to.equal(6);
      done();
    });
  });
});
