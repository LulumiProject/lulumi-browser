<template lang="pug">
.hits(:class="{ open: isOpen }")
  .hit-list-container
    ul
      li.results-category(v-for="(suggestion, hIndex) in suggestions")
        .highlighted-header(@click="handleBlur") {{ suggestion.header }}
        ul
          li.results-items(v-for="(result, index) in suggestion.results"
              :class="{'highlighted': highlightedIndex === `${hIndex}-${index}`}"
              @click="select(result.item)")
            | {{ result.item.title }}
  .hit-detail-container
    .hit-detail
      object(v-if="!loading",
             :data="currentHitProp('icon')",
             type='image/png',
             height='64',
             width='64')
        i(:class="`el-icon-${$store.getters.tabConfig.lulumiDefault.tabFavicon}`",
          style='font-size: 64px;')
      .hit-detail-title {{ currentHitProp('title') }}
      hr.hit-detail-hr
      span {{ currentHitProp('value') }}
</template>

<script lang="ts">
/* global Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import SearchBar from './SearchBar.vue';

@Component({
  name: 'hits',
})
export default class Hits extends Vue {
  highlightedIndex = '';
  suggestions: Lulumi.CommandPalette.Suggestion[] = [];
  searchBar: SearchBar | null = null;
  loading = false;
  isOpen = false;

  get lastActiveWindow(): Lulumi.Store.LulumiBrowserWindowProperty {
    return this.$store.getters.windows.find(window => window.lastActive);
  }

  handleBlur(): void {
    this.$electron.remote.getGlobal('commandPalette').hide();
  }
  select(item: { url: string }): void {
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
  currentHitProp(prop: string): string {
    if (this.highlightedIndex === '') {
      return '';
    }
    const [hIndex, index] = this.highlightedIndex.split('-', 2);
    if (this.suggestions[parseInt(hIndex, 10)].results[parseInt(index, 10)] === undefined) {
      return '';
    }
    return this.suggestions[parseInt(hIndex, 10)].results[parseInt(index, 10)].item[prop];
  }

  mounted(): void {
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
  background-color: #a7a7a7;
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

.hit-detail-title {
  width: 100%;
  font-size: 26px;
  margin-top: 15px;
  padding: 5px 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.hit-detail-hr {
  border: 0;
  border-top: 1px solid #d6d7d9;
  margin: 20px 0;
  width: 95%;
}
</style>
