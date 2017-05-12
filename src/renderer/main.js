import Vue from 'vue';
import Electron from 'vue-electron';
import axios from 'axios';
import { Autocomplete, Scrollbar } from 'element-ui';
import 'element-ui/lib/theme-default/index';
import 'iview/dist/styles/iview.css';

import App from './App';
import router from './router';
import store from './store';
import i18n from './i18n';

Vue.use(Electron);
Vue.prototype.$http = axios;
Vue.http = Vue.prototype.$http;

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

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

/* eslint-disable no-new */
new Vue({
  components: { App },
  i18n,
  router,
  store,
  template: '<App/>',
}).$mount('#app');
