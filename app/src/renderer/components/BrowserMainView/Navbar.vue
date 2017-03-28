<template lang="pug">
  #browser-navbar
    .control-group
      a(@click="$parent.onClickHome")
        icon(name="angle-double-left")
      a(@click="$parent.onClickBack", :class="page.canGoBack ? '' : 'disabled'")
        icon(name="angle-left")
      a(@click="$parent.onClickForward", :class="page.canGoForward ? '' : 'disabled'")
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
    el-cascader#dropdown(expand-trigger="hover", :options="options", v-model="selectedOptions", @change="handleChange")
</template>

<script>
  import Vue from 'vue';
  import { focus } from 'vue-focus';

  import Icon from 'vue-awesome/components/Icon';
  import 'vue-awesome/icons/angle-double-left';
  import 'vue-awesome/icons/angle-left';
  import 'vue-awesome/icons/angle-right';
  import 'vue-awesome/icons/refresh';
  import 'vue-awesome/icons/times';

  import { Cascader } from 'element-ui';

  import '../../css/el-autocomplete';
  import '../../css/el-input';
  import '../../css/el-cascader';
  import config from '../../js/constants/config';
  import urlUtil from '../../js/lib/urlutil';
  import recommendTopSite from '../../js/data/RecommendTopSite';

  Vue.component('url-suggestion', {
    functional: true,
    render(h, ctx) {
      const item = ctx.props.item;
      return h('li', ctx.data, [
        h('div', { attrs: { class: 'location' } }, [item.value,
          h('span', { attrs: { class: 'name' } }, [
            ' - ',
            item.title || '',
          ]),
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
      'el-cascader': Cascader,
    },
    computed: {
      page() {
        return this.$store.getters.pages[this.$store.getters.currentPageIndex];
      },
      currentSearchEngine() {
        return this.$store.getters.currentSearchEngine;
      },
    },
    methods: {
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
        const results =
          queryString ? suggestions.filter(this.createFilter(queryString)) : suggestions;
        results.push({
          title: `${this.currentSearchEngine.name} Search`,
          value: this.value,
        });
        if (results.length === 1 && urlUtil.isURL(this.value)) {
          results.unshift({
            title: 'Page',
            value: this.value,
          });
        }
        cb(results);
      },
      createFilter(queryString) {
        return suggestion => (suggestion.value.indexOf(queryString.toLowerCase()) === 0);
      },
      handleChange(val) {
        this.$parent.onNewTab(`${config.lulumiPagesCustomProtocol}about/#/${val.pop()}`);
      },
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
    background: linear-gradient(to bottom, #eee, #ddd);
    border-bottom: 1px solid #aaa;
  }
  #browser-navbar a {
    text-decoration: none;
    color: #777;
    cursor: pointer;
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
