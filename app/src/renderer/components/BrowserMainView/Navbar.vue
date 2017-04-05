<template lang="pug">
  #browser-navbar
    .control-group
      a(@click="$parent.onClickHome")
        icon(name="angle-double-left")
      a(id="browser-navbar__goBack", @click="$parent.onClickBack", @contextmenu="$parent.onClickBackContextMenu()", @mousedown="onGoBackMouseDown", @mouseup="onGoBackMouseUp", :class="page.canGoBack ? '' : 'disabled'")
        icon(name="angle-left")
      a(id="browser-navbar__goForward", @click="$parent.onClickForward", @contextmenu="$parent.onClickForwardContextMenu()", @mousedown="onGoForwardMouseDown", @mouseup="onGoForwardMouseUp", :class="page.canGoForward ? '' : 'disabled'")
        icon(name="angle-right")
      a(v-if="page.isLoading" @click="$parent.onClickStop")
        icon(name="times")
      a(v-else @click="$parent.onClickRefresh", :class="page.canRefresh ? '' : 'disabled'")
        icon(name="refresh")
    .input-group(@contextmenu="$parent.onNavContextMenu")
      good-custom-autocomplete#url-input(
        @input="onChange",
        @select="onSelect",
        icon="search",
        :trigger-on-focus="false",
        placeholder="Enter a URL or search a term",
        :fetch-suggestions="querySearch",
        v-focus="focused",
        :value="page.location",
        popper-class="my-autocomplete",
        custom-item="url-suggestion")
        el-button(slot="prepend")
          div.secure(v-if="secure")
            icon(name="lock")
            span Secure
          div(v-else)
            icon(name="info-circle")
            span Normal
    el-cascader#dropdown(expand-trigger="hover", :options="options", v-model="selectedOptions", @change="handleChange")
</template>

<script>
  import Vue from 'vue';
  import url from 'url';
  import { focus } from 'vue-focus';

  import Icon from 'vue-awesome/components/Icon';
  import 'vue-awesome/icons/angle-double-left';
  import 'vue-awesome/icons/angle-left';
  import 'vue-awesome/icons/angle-right';
  import 'vue-awesome/icons/refresh';
  import 'vue-awesome/icons/times';
  import 'vue-awesome/icons/lock';
  import 'vue-awesome/icons/info-circle';

  import { Button, Cascader } from 'element-ui';

  import '../../css/el-autocomplete';
  import '../../css/el-input';
  import '../../css/el-cascader';
  import config from '../../js/constants/config';
  import urlUtil from '../../js/lib/url-util';
  import urlSuggestion from '../../js/lib/url-suggestion';
  import recommendTopSite from '../../js/data/RecommendTopSite';

  Vue.component('url-suggestion', {
    functional: true,
    render(h, ctx) {
      const item = ctx.props.item;
      if (item.title) {
        return h('li', ctx.data, [
          h('div', { attrs: { class: 'location' } }, [
            h('i', { attrs: { class: `el-icon-${item.icon}`, style: 'padding-right: 10px;' } }),
            item.value,
            h('span', { attrs: { class: 'name' } }, [
              ' - ',
              item.title || '',
            ]),
          ]),
        ]);
      }
      return h('li', ctx.data, [
        h('div', { attrs: { class: 'location' } }, [
          h('i', { attrs: { class: `el-icon-${item.icon}`, style: 'padding-right: 10px;' } }),
          item.value,
        ]),
      ]);
    },
    props: {
      item: {
        type: Object,
        required: true,
      },
    },
  });

  export default {
    directives: {
      focus,
    },
    data() {
      return {
        handler: null,
        inputHandler: null,
        blurHandler: null,
        secure: false,
        focused: false,
        value: '',
        suggestions: recommendTopSite,
        selectedOptions: [],
        options: [
          {
            value: 'preferences',
            label: 'Preferences',
          },
          {
            value: 'downloads',
            label: 'downloads',
          },
          {
            value: 'history',
            label: 'history',
          },
          {
            value: 'extensions',
            label: 'extensions',
          },
          {
            value: 'help',
            label: 'Help',
            children: [
              {
                value: 'lulumi',
                label: 'About Lulumi',
              },
            ],
          },
        ],
      };
    },
    components: {
      Icon,
      'el-button': Button,
      'el-cascader': Cascader,
    },
    computed: {
      page() {
        if (this.$store.getters.pages.length === 0) {
          return {
            canGoBack: false,
            canGoForward: false,
            canRefresh: false,
          };
        }
        return this.$store.getters.pages[this.$store.getters.currentPageIndex];
      },
      location() {
        if (this.$store.getters.pages.length === 0) {
          return '';
        }
        return this.$store.getters.pages[this.$store.getters.currentPageIndex].location;
      },
      currentSearchEngine() {
        return this.$store.getters.currentSearchEngine;
      },
    },
    watch: {
      location(newLocation) {
        const currentLocation = url.parse(newLocation, true);
        const originalInput = document.getElementsByClassName('el-input__inner')[0];
        const newElement = document.getElementById('securityLocation');
        if (currentLocation.protocol === 'https:' || currentLocation.protocol === 'wss:') {
          this.secure = true;
          const newLocation
            = `<div class="security-location"><span style="color: #3c943c;">${currentLocation.protocol}</span>${currentLocation.href.substr(currentLocation.protocol.length)}</div>`;
          originalInput.style.display = 'none';

          this.inputHandler = () => {
            newElement.style.display = 'none';
            originalInput.style.display = 'block';
            originalInput.focus();
          };
          this.blurHandler = () => {
            newElement.style.display = 'block';
            originalInput.style.display = 'none';
          };

          newElement.innerHTML = newLocation;
          newElement.style.display = 'block';

          newElement.removeEventListener('click', this.inputHandler, false);
          originalInput.removeEventListener('blur', this.blurHandler, false);
          newElement.addEventListener('click', this.inputHandler);
          originalInput.addEventListener('blur', this.blurHandler);
        } else {
          this.secure = false;

          newElement.style.display = 'none';
          originalInput.style.display = 'block';

          newElement.removeEventListener('click', this.inputHandler, false);
          originalInput.removeEventListener('blur', this.blurHandler, false);
        }
      },
    },
    methods: {
      onGoBackMouseDown() {
        this.handler = setTimeout(() => this.$parent.onClickBackContextMenu(), 300);
      },
      onGoForwardMouseDown() {
        this.handler = setTimeout(() => this.$parent.onClickForwardContextMenu(), 300);
      },
      onGoBackMouseUp() {
        if (this.handler) {
          clearTimeout(this.handler);
        }
      },
      onGoForwardMouseUp() {
        if (this.handler) {
          clearTimeout(this.handler);
        }
      },
      onChange(val) {
        this.value = val;
      },
      onSelect(event) {
        if (event.title === `${this.currentSearchEngine.name} Search`) {
          this.$parent.onEnterLocation(
            `${this.currentSearchEngine.search}${encodeURIComponent(event.value)}`);
        } else {
          this.$parent.onEnterLocation(event.value);
        }
      },
      querySearch(queryString, cb) {
        const suggestions = this.suggestions;
        let results =
          queryString ? suggestions.filter(this.createFilter(queryString)) : suggestions;
        results.push({
          title: `${this.currentSearchEngine.name} Search`,
          value: this.value,
          icon: 'search',
        });
        if (results.length === 1 && urlUtil.isURL(this.value)) {
          results.unshift({
            value: this.value,
            icon: 'document',
          });
        }
        results = urlSuggestion(this.currentSearchEngine.name, `${this.currentSearchEngine.autocomplete}${this.value}`, results);
        cb(results);
      },
      createFilter(queryString) {
        return suggestion => (suggestion.value.indexOf(queryString.toLowerCase()) === 0);
      },
      handleChange(val) {
        this.$parent.onNewTab(`${config.lulumiPagesCustomProtocol}about/#/${val.pop()}`);
      },
    },
    mounted() {
      const originalInput = document.getElementsByClassName('el-input__inner')[0];
      const newElement = document.createElement('div');
      newElement.id = 'securityLocation';
      newElement.classList = 'el-input__inner';
      newElement.innerHTML = '';
      newElement.style.display = 'none';
      originalInput.parentElement.append(newElement);
    },
  };
</script>

<style scoped>
  #browser-navbar {
    display: flex;
    height: 35px;
    padding: 0 5px;
    font-size: 15px;
    font-weight: 100;
    border-bottom: 1px solid #aaa;
  }
  #browser-navbar a {
    text-decoration: none;
    color: #777;
    cursor: default;
  }
  #browser-navbar a:hover {
    text-decoration: none;
    color: blue;
  }
  #browser-navbar a.disabled {
    color: #bbb;
    cursor: default;
  }
  #browser-navbar a {
    flex: 1;
  }
  #browser-navbar .control-group {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }
  #browser-navbar > .input-group {
    flex: 9;
    display: flex;
    margin: 0 5px;
  }
  #url-input {
    flex: 1;
    display: flex;
  }
  #browser-navbar .input-group a {
    border: 1px solid #bbb;
    border-left: 0;
    padding: 4px 0;
    margin: 4px 0 3px;
    flex: 0 0 30px;
    text-align: center;
  }
  #browser-navbar a:last-child {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
  }

  #dropdown {
    width: 0px;
    margin: 5px -5px 2px 30px;
  }
</style>
