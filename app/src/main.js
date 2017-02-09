import Vue from 'vue';
import Electron from 'vue-electron';
import Resource from 'vue-resource';
import Router from 'vue-router';
import { Autocomplete } from 'element-ui';

import App from './App';
import routes from './routes';

Vue.use(Electron);
Vue.use(Resource);
Vue.use(Router);
Vue.config.debug = true;

const CustomAutocomplete = Vue.extend(Autocomplete);
const GoodCustomAutocomplete = CustomAutocomplete.extend({
  methods: {
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
        console.log(this.suggestions[this.highlightedIndex].value);
      } else {
        this.$parent.$parent.onEnterLocation(event.target.value);
        this.select({ value: event.target.value });
      }
    },
  },
});
Vue.component('good-custom-autocomplete', GoodCustomAutocomplete);

const router = new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes,
});

/* eslint-disable no-new */
new Vue({
  router,
  ...App,
}).$mount('#app');
