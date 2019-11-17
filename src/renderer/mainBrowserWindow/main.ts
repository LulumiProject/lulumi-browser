import Vue from 'vue';
import Electron from 'vue-electron';
import { Autocomplete } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import 'iview/dist/styles/iview.css';
import 'modern-normalize/modern-normalize.css';

import App from './App.vue';
import router from './router';
import store from '../../shared/store/rendererStore';
import i18n from './i18n';

Vue.use(Electron);

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

// Customize Autocomplete component to match out needs
const customAutocomplete = Vue.extend(Autocomplete);
const goodCustomAutocomplete = customAutocomplete.extend({
  // https://bit.ly/2KpCoRf
  inheritAttrs: true,
  data() {
    return {
      activated: false,
      isComposing: false,
      suggestions: [],
      loading: false,
      highlightedIndex: -1,
      suggestionDisabled: false,
      lastQueryString: '',
    };
  },
  computed: {
    suggestionVisible() {
      const suggestions = this.suggestions;
      const isValidData = Array.isArray(suggestions) && suggestions.length > 0;
      // Don't show suggestions if we have no input there
      return (isValidData || this.loading) && this.activated && this.value;
    },
  },
  methods: {
    setInputSelection(input, startPos, endPos) {
      input.focus();
      if (input.selectionStart !== undefined) {
        input.selectionStart = startPos;
        input.selectionEnd = endPos;
      } else if ((document as any).selection && (document as any).selection.createRange) {
        // IE branch
        input.select();
        const range = (document as any).selection.createRange();
        range.collapse(true);
        range.moveEnd('character', endPos);
        range.moveStart('character', startPos);
        range.select();
      }
    },
    getData(queryString) {
      if (this.suggestionDisabled) {
        return;
      }
      const el = ((this.$refs.input as Vue).$el as HTMLInputElement)
        .querySelector('input');
      this.loading = true;
      this.fetchSuggestions(queryString, (suggestions) => {
        this.loading = false;
        if (Array.isArray(suggestions)) {
          this.suggestions = suggestions;
          this.highlightedIndex = 0;

          if (el && el.selectionStart === queryString.length) {
            if (this.lastQueryString !== queryString) {
              const startPos = queryString.length;
              const endPos = this.suggestions[0].item.url.length;
              this.$refs.input.$refs.input.value
                = `${queryString}${this.suggestions[0].item.url.substr(queryString.length)}`;
              this.setInputSelection(el, startPos, endPos);
              this.lastQueryString = queryString;
            } else {
              this.lastQueryString = this.lastQueryString.slice(0, -1);
            }
          }
        } else {
          // tslint:disable-next-line no-console
          console.error('[Element Error][Autocomplete]autocomplete suggestions must be an array');
        }
      });
    },
    handleChange(value) {
      this.$emit('input', value);
      this.suggestionDisabled = false;
      if (!this.triggerOnFocus && !value) {
        this.suggestionDisabled = true;
        this.suggestions = [];
        return;
      }
      this.debouncedGetData(value);
    },
    handleFocus(event) {
      event.target.select();
      this.activated = true;
      this.$emit('focus', event);
      if (this.triggerOnFocus) {
        this.debouncedGetData(this.value);
      }
    },
    handleKeyEnter(event) {
      if (!this.isComposing) {
        if (this.suggestionVisible
          && this.highlightedIndex >= 0
          && this.highlightedIndex < this.suggestions.length) {
          event.preventDefault();
          this.select(this.suggestions[this.highlightedIndex]);
        } else if (this.selectWhenUnmatched) {
          this.$emit('select', { value: this.value });
          this.$nextTick(() => {
            this.suggestions = [];
            this.highlightedIndex = -1;
          });
        }
      }
    },
    highlight(index) {
      if (!this.suggestionVisible || this.loading) { return; }
      if (index < 0) {
        return;
      }
      let newIndex = index;
      if (index >= this.suggestions.length) {
        newIndex = this.suggestions.length - 1;
      }
      const suggestion = this.$refs.suggestions.$el.querySelector('.el-autocomplete-suggestion__wrap');
      const suggestionList = suggestion.querySelectorAll('.el-autocomplete-suggestion__list li');
      const highlightItem = suggestionList[newIndex];
      const scrollTop = suggestion.scrollTop;
      const offsetTop = highlightItem.offsetTop;
      if (offsetTop + highlightItem.scrollHeight > (scrollTop + suggestion.clientHeight)) {
        suggestion.scrollTop += highlightItem.scrollHeight;
      }
      if (offsetTop < scrollTop) {
        suggestion.scrollTop -= highlightItem.scrollHeight;
      }
      this.highlightedIndex = newIndex;
      const $input = this.getInput();
      $input.setAttribute('aria-activedescendant', `${this.id}-item-${this.highlightedIndex}`);
      this.$emit('input', this.suggestions[this.highlightedIndex].item.value);
    },
  },
});
Vue.component('good-custom-autocomplete', goodCustomAutocomplete);

new Vue({
  i18n,
  router,
  store,
  components: { App },
  render(h) {
    return h('App');
  },
  name: 'root',
}).$mount('#app');
