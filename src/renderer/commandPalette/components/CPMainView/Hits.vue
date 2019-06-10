<template lang="pug">
.hits(:class="{ open: isOpen }")
  .hit-list-container
    ul
      li(v-for="hitHeader in hitHeaders")
        .highlighted-header(@click="handleBlur") {{ hitHeader }}
        ul
          li(v-for="(suggestion, index) in suggestions"
              :class="{'highlighted': highlightedIndex === index}"
              @click="select(suggestion.item)")
            | {{ suggestion.item.title }}
  .hit-detail-container
    .hit-detail
      img.hit-detail-image(:src="currentHitProp('icon')")
      h1.hit-detail-title {{ currentHitProp('value') }}
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

  get hitHeaders() {
    return ['Browsing History'];
  }
  get isOpen() {
    return this.suggestions.length > 0;
  }

  handleBlur() {
    this.$electron.ipcRenderer.send('alfred-blur');
  }
  select(item) {
    this.$nextTick(() => {
      const browserWindow = this.$electron.remote.BrowserWindow.getFocusedWindow();
      if (browserWindow !== null) {
        browserWindow.webContents.send('new-tab', {
          url: item.url,
          follow: true,
        });
      }
    });
    this.$electron.ipcRenderer.send('alfred-blur');
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
  transition: all 0.3s;
  background-color: rgba(0, 20, 41, 0.97);
}

.hits.open {
  min-height: 375px;
  max-height: 400px;
  border-top: 1px solid #515253;
}

.hit-list-container {
  width: 290px;
  overflow: hidden;
  overflow-y: auto;
  user-select: none;
  position: absolute;
  height: calc(100% - 55px);
  background-color: rgba(0, 20, 41, 0.97);
  border-right: 1px solid #515253;
}

ul {
  min-height: calc(100% - 55px);
}

ul,
li {
  margin: 0;
  padding: 0;
  width: 100%;
  color: white;
  cursor: pointer;
  font-size: 12px;
  padding: 3px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  list-style-type: none;
}

.highlighted-header {
  color: #ffffff;
  font-size: 12px;
  padding: 4px 0 2px 25px;
  text-transform: uppercase;
  background-color: rgba(53, 75, 84, 0.97);
}

.highlighted {
  color: black;
  background: #F9FAFC;
  cursor: pointer;
  font-size: 12px;
}

.hit-detail-container {
  width: 390px;
  height: 375px;
  display: block;
  color: #ffffff;
  overflow-y: auto;
  margin-left: 290px;
  background-color: rgba(1, 20, 41, 0.97);
}

.hit-detail {
  padding: 8px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}

.hit-detail-image {
  height: 250px;
  border-radius: 15px;
}

.hit-detail-title {
  color: #ffffff;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
