<template lang="pug">
.hits(:class="{ open: isOpen }")
  .hit-list-container
    ul
      li.results-category(v-for="hitHeader in hitHeaders")
        .highlighted-header(@click="handleBlur") {{ hitHeader }}
        ul
          li.results-items(v-for="(suggestion, index) in suggestions"
              :class="{'highlighted': highlightedIndex === index}"
              @click="select(suggestion.item)")
            | {{ suggestion.item.title }}
  .hit-detail-container
    .hit-detail
      img.hit-detail-image(:src="currentHitProp('icon')")
      .hit-detail-title {{ currentHitProp('value') }}
      span {{ currentHitProp('title') }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import SearchBar from './SearchBar.vue';

@Component({
  name: 'hits',
})
export default class Hits extends Vue {
  highlightedIndex: number = -1;
  suggestions: Lulumi.Renderer.SuggestionObject[] = [];
  searchBar: SearchBar | null = null;

  get lastActiveWindow(): Lulumi.Store.LulumiBrowserWindowProperty {
    return this.$store.getters.windows.find(window => window.lastActive);
  }
  get hitHeaders() {
    return ['Browsing History'];
  }
  get isOpen() {
    return this.suggestions.length > 0;
  }

  handleBlur() {
    this.$electron.remote.getGlobal('commandPalette').hide();
  }
  select(item) {
    this.$nextTick(() => {
      const browserWindow = this.$electron.remote.BrowserWindow.fromId(this.lastActiveWindow.id);
      if (browserWindow !== null) {
        browserWindow.show();
        browserWindow.webContents.send('new-tab', {
          url: item.url,
          follow: true,
        });
      }
    });
    this.$electron.remote.getGlobal('commandPalette').hide();
  }
  currentHitProp(prop) {
    if (this.suggestions[this.highlightedIndex] === undefined) {
      return '';
    }
    return this.suggestions[this.highlightedIndex].item[prop];
  }

  mounted() {
    this.searchBar = this.$parent.$refs.searchBar as SearchBar;
  }
}
</script>

<style lang="less" scoped>
.hits {
  max-height: 0;
  min-height: 0;
  overflow: hidden;
  transition: all 0.1s;
}

.hits.open {
  max-height: 375px;
  max-height: 400px;
  border-top: 1px solid #cccecf
}

.hit-list-container {
  width: 40%;
  overflow: hidden;
  overflow-y: auto;
  user-select: none;
  position: absolute;
  height: calc(100% - 55px);
  border-right: 1px solid #d6d7d9;
  background-color: rgba(229,231,232,.97);

  ul,
  li.results-category {
    width: 100%;
    margin: 0;
    padding: 0;
    list-style-type: none;
  }

  li.results-items {
    margin: 0;
    padding: 0;
    width: 100%;
    color: #333435;
    cursor: pointer;
    font-size: 12px;
    padding: 6px 0 6px 25px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    list-style-type: none;

    &.highlighted {
      color: #fff;
      background-color: #337ef1;
    }
  }
}

.highlighted-header {
  color: #333435;
  font-size: 12px;
  padding: 4px 0 2px 25px;
  text-transform: uppercase;
  background-color: #dcdddf;
}

.hit-detail-container {
  width: 60%;
  margin-left: 40%;
  height: 475px;
  padding: 10px;
  display: block;
  color: #333435;
  overflow-y: auto;
  background-color: rgba(229,230,232,.97);
}

.hit-detail {
  padding-top: 20%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}

.hit-detail-image {
  width: 64px;
  height: 64px;
}

.hit-detail-title {
  width: 100%;
  font-size: 26px;
  margin-top: 15px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
