import Vue from 'vue';
import Electron from 'vue-electron';
import { Autocomplete, Scrollbar } from 'element-ui';

import BrowserMainView from 'components/BrowserMainView';
import config from 'renderer/js/constants/config';

import router from 'renderer/router';
import store from 'renderer/store';

import { name } from 'src/../.electron-vue/config';

/* eslint-disable no-unused-expressions */

Vue.prototype.$t = () => {};
Vue.use(Electron);

Vue.config.productionTip = false;
Vue.config.devtools = false;

// Customize Autocomplete component to match out needs
const CustomAutocomplete = Vue.extend(Autocomplete);
const GoodCustomAutocomplete = CustomAutocomplete.extend({
  data() {
    return {
      lastQueryString: '',
    };
  },
  computed: {
    suggestionVisible() {
      const suggestions = this.suggestions;
      const isValidData = Array.isArray(suggestions) && suggestions.length > 0;
      // Don't show suggestions if we have no input there
      return (isValidData || this.loading) && this.isFocus && this.value;
    },
  },
  methods: {
    setInputSelection(input, startPos, endPos) {
      input.focus();
      if (typeof input.selectionStart !== 'undefined') {
        input.selectionStart = startPos;
        input.selectionEnd = endPos;
      } else if (document.selection && document.selection.createRange) {
        // IE branch
        input.select();
        const range = document.selection.createRange();
        range.collapse(true);
        range.moveEnd('character', endPos);
        range.moveStart('character', startPos);
        range.select();
      }
    },
    getData(queryString) {
      const el = this.$refs.input.$el.querySelector('.el-input__inner');
      this.loading = true;
      this.fetchSuggestions(queryString, (suggestions) => {
        this.loading = false;
        if (Array.isArray(suggestions)) {
          this.suggestions = suggestions;
          this.highlightedIndex = 0;

          if (el.selectionStart === queryString.length) {
            if (this.lastQueryString !== queryString) {
              const startPos = queryString.length;
              const endPos = this.suggestions[0].value.length;
              this.$nextTick().then(() => {
                this.$refs.input.$refs.input.value = this.suggestions[0].value;
                this.setInputSelection(el, startPos, endPos);
                this.lastQueryString = queryString;
              });
            } else {
              this.lastQueryString = this.lastQueryString.slice(0, -1);
            }
          }
        } else {
          // eslint-disable-next-line no-console
          console.error('autocomplete suggestions must be an array');
        }
      });
    },
    handleComposition(event) {
      if (event.type === 'compositionend') {
        this.isOnComposition = false;
        this.handleChange(event.value);
      } else {
        this.isOnComposition = true;
      }
    },
    handleChange(value) {
      this.$emit('input', value);
      if (this.isOnComposition || (!this.triggerOnFocus && !value)) {
        this.lastQueryString = '';
        this.suggestions = [];
        return;
      }
      this.getData(value);
    },
    handleFocus(event) {
      event.target.select();
      this.isFocus = true;
      if (this.triggerOnFocus) {
        this.getData(this.value);
      }
    },
    handleKeyEnter(event) {
      if (this.suggestionVisible
            && this.highlightedIndex >= 0
            && this.highlightedIndex < this.suggestions.length) {
        this.select(this.suggestions[this.highlightedIndex]);
      } else {
        this.$parent.$parent.onEnterLocation(event.target.value);
        this.select({
          title: '',
          value: event.target.value,
        });
      }
    },
    highlight(index) {
      if (!this.suggestionVisible || this.loading) {
        return;
      }
      if (index < 0) {
        index = 0;
      }
      if (index >= this.suggestions.length) {
        index = this.suggestions.length - 1;
      }
      const suggestion = this.$refs.suggestions.$el.querySelector('.el-autocomplete-suggestion__wrap');
      const suggestionList = suggestion.querySelectorAll('.el-autocomplete-suggestion__list li');
      const highlightItem = suggestionList[index];
      const scrollTop = suggestion.scrollTop;
      const offsetTop = highlightItem.offsetTop;
      if (offsetTop + highlightItem.scrollHeight > (scrollTop + suggestion.clientHeight)) {
        suggestion.scrollTop += highlightItem.scrollHeight;
      }
      if (offsetTop < scrollTop) {
        suggestion.scrollTop -= highlightItem.scrollHeight;
      }
      this.highlightedIndex = index;
      if (index >= 0) {
        this.$refs.input.$refs.input.value = this.suggestions[this.highlightedIndex].value;
      }
    },
  },
});
Vue.component('good-custom-autocomplete', GoodCustomAutocomplete);
Vue.component('el-scrollbar', Scrollbar);

let vm;
describe('BrowserMainView.vue', () => {
  before(async () => {
    const Ctor = Vue.extend(BrowserMainView);
    vm = new Ctor({
      el: document.createElement('div'),
      router,
      store,
    }).$mount();
    // we need at least one active tab
    vm.$store.dispatch('createTab', {
      url: undefined,
      follow: true,
    });
    await vm.$nextTick();
  });

  describe('functions', () => {
    after(() => {
      vm.$store.dispatch('closeTab', 0);
    });

    describe('computed.tabsOrder()', () => {
      it('has no members in tabsOrder initially', () => {
        expect(vm.tabsOrder).to.be.empty;
      });
    });

    describe('computed.homepage()', () => {
      it('has correct default homepage', () => {
        expect(vm.homepage).to.equal(config.homepage);
      });
    });

    describe('computed.pdfViewer()', () => {
      it('has correct default pdfViewer', () => {
        expect(vm.pdfViewer).to.equal(config.pdfViewer);
      });
    });

    describe('methods.getWebView()', () => {
      it('has the corresponding webview element', () => {
        expect(vm.getWebView().getAttribute('src')).to.equal(config.tabConfig.defaultUrl);
      });
    });

    describe('methods.getPage()', () => {
      it('can call navigateTo method from certain page instance to let the webview navigate to somewhere', () => {
        vm.getPage().navigateTo('https://www.youtube.com/');
        expect(vm.getWebView().getAttribute('src')).to.equal('https://www.youtube.com/');
      });
    });

    describe('methods.getPageObject()', () => {
      it('can call navigateTo method from certain page instance to let the webview navigate to somewhere', () => {
        vm.getPage().navigateTo('https://github.com/qazbnm456/lulumi-browser');
        expect(vm.getPageObject().location).to.equal('https://github.com/qazbnm456/lulumi-browser');
      });
    });

    describe('methods.onDidFailLoad()', () => {
      it('shows error page when it received did-fail-load event', () => {
        const event = {
          errorCode: -105,
          validatedURL: 'http://test/test/',
          target: {
            getURL: () => 'http://test/test/',
          },
        };
        vm.onDidFailLoad(event, 0);
        expect(vm.getWebView().getAttribute('src')).to.contain('/pages/error/index.html');
      });
    });

    describe('methods.onClickHome()', () => {
      it('redirects to homepage', async () => {
        vm.onClickHome();
        expect(vm.getWebView().getAttribute('src')).to.equal(config.homepage);
      });
    });

    describe('methods.onEnterLocation()', () => {
      it('navigates to specified location', async () => {
        vm.onEnterLocation('https://www.youtube.com/');
        expect(vm.getWebView().getAttribute('src')).to.equal('https://www.youtube.com/');
      });
    });
  });

  describe('Tabs.vue (integrated)', () => {
    it('shows the title of webview.getTitle()', async () => {
      vm.$store.dispatch('pageTitleSet', {
        pageIndex: 0,
        webview: {
          getTitle: () => name,
        },
      });
      await vm.$nextTick();
      expect(vm.$el.querySelector('.chrome-tab-current .chrome-tab-title').innerHTML).to.equal(name);
    });

    it('shows the volume icon when there exists at least one media in the page, and it\'s playing', async () => {
      vm.$store.dispatch('mediaStartedPlaying', {
        pageIndex: 0,
        webview: {
          isAudioMuted: () => false,
        },
      });
      await vm.$nextTick();
      expect(vm.$el.querySelector('svg.volume-up')).to.exist;
    });

    it('shows the volume icon when there exists at least one media in the page, and it\'s not playing', async () => {
      vm.$store.dispatch('mediaStartedPlaying', {
        pageIndex: 0,
        webview: {
          isAudioMuted: () => true,
        },
      });
      await vm.$nextTick();
      expect(vm.$el.querySelector('svg.volume-off')).to.exist;
    });

    it('adds one more tab', async () => {
      vm.$store.dispatch('createTab', {
        url: 'https://www.youtube.com/',
        follow: false,
      });
      await vm.$nextTick();
      expect(vm.$el.querySelectorAll('.chrome-tab-draggable').length).to.equal(2);
    });

    it('clicks last created tab', async () => {
      vm.$store.dispatch('clickTab', 1);
      await vm.$nextTick();
      expect(vm.$el.querySelector('.chrome-tab-current').id).to.equal('1');
    });

    it('removes last created tab and moves to adjacent tab', async () => {
      vm.$store.dispatch('closeTab', 1);
      await vm.$nextTick();
      expect(vm.$el.querySelectorAll('.chrome-tab-draggable').length).to.equal(1);
      expect(vm.$el.querySelector('.chrome-tab-current').id).to.equal('0');
    });
  });

  describe('Navbar.vue (integrated)', () => {
    it('shows the corresponding url to the webview', () => {
      const urlInput = vm.$el.querySelector('.el-input .el-input__inner');
      expect(vm.$el.querySelector('webview.active').src).to.equal(urlInput.value);
    });

    it('has four controls in .control-group', () => {
      expect(vm.$el.querySelector('.ivu-icon-ios-home')).to.exist;
      expect(vm.$el.querySelector('.ivu-icon-arrow-left-c')).to.exist;
      expect(vm.$el.querySelector('.ivu-icon-arrow-right-c')).to.exist;
      expect(vm.$el.querySelector('.ivu-icon-android-refresh')).to.exist;
    });
  });

  describe('Page.vue (integrated)', () => {
    it('shows the corresponding url to the webview', () => {
      const urlInput = vm.$el.querySelector('.el-input .el-input__inner');
      expect(vm.$el.querySelector('webview.active').src).to.equal(urlInput.value);
    });
  });
});
