import Vue from 'vue';
import Electron from 'vue-electron';
import axios from 'axios';
import { Autocomplete, Scrollbar } from 'element-ui';
import 'element-ui/lib/theme-default/index';
import 'iview/dist/styles/iview.css';

import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';

Vue.use(Electron);
(Vue as any).prototype.$http = axios;
(Vue as any).http = (Vue as any).prototype.$http;

if (process.env.NODE_ENV === 'production') {
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
}

// Customize Autocomplete component to match out needs
const customAutocomplete = Vue.extend(Autocomplete);
const goodCustomAutocomplete = customAutocomplete.extend({
  data() {
    return {
      lastQueryString: '',
    };
  },
  computed: {
    suggestionVisible() {
      const suggestions = (this as any).suggestions;
      const isValidData = Array.isArray(suggestions) && suggestions.length > 0;
      // Don't show suggestions if we have no input there
      return (isValidData || (this as any).loading) && (this as any).isFocus && (this as any).value;
    },
  },
  methods: {
    setInputSelection(input, startPos, endPos) {
      input.focus();
      if (typeof input.selectionStart !== 'undefined') {
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
      const el = (this.$refs.input as any).$el.querySelector('.el-input__inner');
      (this as any).loading = true;
      (this as any).fetchSuggestions(queryString, (suggestions) => {
        (this as any).loading = false;
        if (Array.isArray(suggestions)) {
          (this as any).suggestions = suggestions;
          (this as any).highlightedIndex = 0;

          if (el.selectionStart === queryString.length) {
            if ((this as any).lastQueryString !== queryString) {
              const startPos = queryString.length;
              const endPos = (this as any).suggestions[0].value.length;
              (this as any).$nextTick().then(() => {
                (this as any).$refs.input.$refs.input.value = (this as any).suggestions[0].value;
                (this as any).setInputSelection(el, startPos, endPos);
                (this as any).lastQueryString = queryString;
              });
            } else {
              (this as any).lastQueryString = (this as any).lastQueryString.slice(0, -1);
            }
          }
        } else {
          // tslint:disable-next-line no-console
          console.error('autocomplete suggestions must be an array');
        }
      });
    },
    handleComposition(event) {
      if (event.type === 'compositionend') {
        (this as any).isOnComposition = false;
        (this as any).handleChange(event.value);
      } else {
        (this as any).isOnComposition = true;
      }
    },
    handleChange(value) {
      this.$emit('input', value);
      if ((this as any).isOnComposition || (!(this as any).triggerOnFocus && !value)) {
        (this as any).lastQueryString = '';
        (this as any).suggestions = [];
        return;
      }
      (this as any).getData(value);
    },
    handleFocus(event) {
      event.target.select();
      (this as any).isFocus = true;
      if ((this as any).triggerOnFocus) {
        (this as any).getData((this as any).value);
      }
    },
    handleKeyEnter(event) {
      if ((this as any).suggestionVisible
        && (this as any).highlightedIndex >= 0
        && (this as any).highlightedIndex < (this as any).suggestions.length) {
        (this as any).select((this as any).suggestions[(this as any).highlightedIndex]);
      } else {
        (this.$parent.$parent as any).onEnterLocation(event.target.value);
        (this as any).select({
          title: '',
          value: event.target.value,
        });
      }
    },
    highlight(index) {
      let newIndex = index;
      if (!(this as any).suggestionVisible || (this as any).loading) {
        return;
      }
      if (index < 0) {
        newIndex = 0;
      }
      if (index >= (this as any).suggestions.length) {
        newIndex = (this as any).suggestions.length - 1;
      }
      const suggestion
        = (this.$refs.suggestions as any).$el.querySelector('.el-autocomplete-suggestion__wrap');
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
      (this as any).highlightedIndex = newIndex;
      if (newIndex >= 0) {
        (this.$refs.input as any).$refs.input.value
          = (this as any).suggestions[(this as any).highlightedIndex].value;
      }
    },
  },
});
Vue.component('good-custom-autocomplete', goodCustomAutocomplete);
Vue.component('el-scrollbar', Scrollbar);

new Vue({
  i18n,
  router,
  store,
  components: { App },
  template: '<App/>',
  name: 'root',
}).$mount('#app');
