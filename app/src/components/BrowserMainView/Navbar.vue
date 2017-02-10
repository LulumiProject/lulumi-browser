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
</style>

<template lang="pug">
  #browser-navbar
    .control-group
      a(@click="$parent.onClickHome")
        icon(name="angle-double-left")
      a(@click="$parent.onClickBack", :class="page.canGoBack ? '' : 'disabled'")
        icon(name="angle-left")
      a(@click="$parent.onClickForward", :class="page.canGoForward ? '' : 'disabled'")
        icon(name="angle-right")
      a(@click="$parent.onClickRefresh", :class="page.canRefresh ? '' : 'disabled'")
        icon(name="refresh")
    .input-group(@contextmenu="$parent.onNavContextMenu")
      good-custom-autocomplete#url-input(
        @input="$store.dispatch('updateLocation', $event)",
        @select="$parent.onEnterLocation($event.value)",
        :on-icon-click="handleIconClick",
        :trigger-on-focus="false",
        placeholder='Enter a URL or search a term',
        :fetch-suggestions="querySearch",
        v-focus="focused",
        :value="page.location",
        popper-class='my-autocomplete',
        custom-item='url-suggestion')
</template>

<script>
  import Vue from 'vue';
  import '../../css/el-autocomplete';

  import Icon from 'vue-awesome/components/Icon';
  import 'vue-awesome/icons/angle-double-left';
  import 'vue-awesome/icons/angle-left';
  import 'vue-awesome/icons/angle-right';
  import 'vue-awesome/icons/refresh';

  import { focus } from 'vue-focus';

  import recommendTopSite from '../../js/data/RecommendTopSite';

  Vue.component('url-suggestion', {
    functional: true,
    render(h, ctx) {
      const item = ctx.props.item;
      return h('li', ctx.data, [
        h('div', { attrs: { class: 'location' } }, [item.value]),
        h('span', { attrs: { class: 'name' } }, [item.title || '']),
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
        suggestions: recommendTopSite,
      };
    },
    components: {
      Icon,
    },
    computed: {
      page() {
        return this.$store.getters.pages[this.$store.getters.currentPageIndex];
      },
    },
    methods: {
      querySearch(queryString, cb) {
        const suggestions = this.suggestions;
        const results =
          queryString ? suggestions.filter(this.createFilter(queryString)) : suggestions;
        cb(results);
      },
      createFilter(queryString) {
        return (suggestion) => (suggestion.value.indexOf(queryString.toLowerCase()) === 0);
      },
    },
  };
</script>
