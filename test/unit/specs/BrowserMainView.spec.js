import Vue from 'vue';
import Vuex from 'vuex';
import BrowserMainView from 'src/components/BrowserMainView';

import { name } from '../../../config';

Vue.use(Vuex);

function createPageObject(url) {
  return {
    pid: 0,
    location: url || 'https://github.com/qazbnm456/electron-vue-browser',
    statusText: false,
    title: 'new tab',
    isLoading: false,
    isSearching: false,
    canGoBack: false,
    canGoForward: false,
    canRefresh: false,
  };
}

describe('BrowserMainView.vue', () => {
  it('should render the name of this project in the first created default tab', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(BrowserMainView),
      store: new Vuex.Store({
        state: {
          pid: 0,
          pages: [createPageObject()],
          currentPageIndex: 0,
        },
        getters: {
          pages: state => state.pages,
          currentPageIndex: state => state.currentPageIndex,
        },
      }),
    }).$mount();

    Vue.nextTick(() => {
      expect(vm.$el.querySelector('.active span').textContent).to.contain(name);
    });
  });
});
