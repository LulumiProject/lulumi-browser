<template lang="pug">
.search-bar(@click.self="sendFocus",
            @keydown.up.prevent="highlight(hits.highlightedIndex, -1)",
            @keydown.down.prevent="highlight(hits.highlightedIndex, 1)",
            @keydown.enter="handleKeyEnter")
  .search-icon
    svg(@click.self="sendFocus",
        version="1.1",
        xmlns="http://www.w3.org/2000/svg",
        xmlns:xlink="http://www.w3.org/1999/xlink",
        x="0px",
        y="0px",
        viewBox="0 0 283.753 284.51",
        enable-background="new 0 0 283.753 284.51",
        xml:space="preserve",
        style="fill: #635d5c;")
      path(:d="path")
  input(type="text",
        class="search-input",
        :placeholder="$t('hits.navbar.search')",
        @compositionstart="handleComposition",
        @compositionupdate="handleComposition",
        @compositionend="handleComposition",
        @blur="focus = false",
        @input="debouncedInput",
        :value="value",
        v-focus="focus",
        v-autowidth="{maxWidth: '85vw'}")
  span.description(@click.self="sendFocus") {{ spanValue === '' ? '' : `- ${spanValue}` }}
  .result-icon(v-show="value !== ''")
    object(v-if="!loading", :data="icon", type='image/png', height='32', width='32')
      i(:class="`el-icon-${icon}`", style='font-size: 32px;')
  </div>
</template>

<script lang="ts">
/* global Lulumi */

import { Component, Vue } from 'vue-property-decorator';
import { debounce } from 'lodash';
import * as Comlink from 'comlink';

import Hits from './Hits.vue';

import urlUtil from '../../../lib/url-util';
import config from '../../../mainBrowserWindow/constants';

@Component({
  name: 'search-bar',
  // https://vuejs.org/v2/guide/custom-directive.html
  directives: {
    focus: {
      // When the bound element is inserted into the DOM...
      update(el, { value }) {
        if (value) {
          // Focus the element
          el.focus();
        }
      },
    },
  },
})
export default class SearchBar extends Vue {
  value = '';
  spanValue = '';
  icon = '';
  focus = false;
  loading = false;
  isComposing = false;
  recommender: any;
  suggestionItems: Lulumi.CommandPalette.SuggestionItem[] = config.recommendTopSite;
  debouncedQuerySearch: (queryString: string) => Promise<void>;
  hits: Hits | null = null;

  get tabFavicon(): string {
    return this.$store.getters.tabConfig.lulumiDefault.tabFavicon;
  }
  get autoFetch(): boolean {
    return this.$store.getters.autoFetch;
  }
  get currentSearchEngine(): Lulumi.Store.SearchEngineObject {
    return this.$store.getters.currentSearchEngine;
  }
  get suggestionItemsByHistory(): any {
    const suggestionItems: Lulumi.CommandPalette.SuggestionItem[] = [];
    const regex = new RegExp(/(^\w+:|^)\/\//);
    this.$store.getters.history.forEach((history) => {
      const part: string = history.url.replace(regex, '');
      suggestionItems.push({
        title: history.title,
        value: part,
        url: part,
        icon: history.favIconUrl,
      });
    });
    return suggestionItems;
  }
  get path(): string {
    // eslint-disable-next-line max-len
    return 'M281.394,264.378l0.135-0.135L176.24,158.954c30.127-38.643,27.45-94.566-8.09-130.104 c-38.467-38.467-100.833-38.467-139.3,0c-38.467,38.467-38.466,100.833,0,139.299c35.279,35.279,90.644,38.179,129.254,8.748 l103.859,103.859c0.01,0.01,0.021,0.021,0.03,0.03l1.495,1.495l0.134-0.134c2.083,1.481,4.624,2.36,7.375,2.36 c7.045,0,12.756-5.711,12.756-12.756C283.753,269.002,282.875,266.462,281.394,264.378z M47.388,149.612 c-28.228-28.229-28.229-73.996,0-102.225c28.228-28.229,73.996-28.228,102.225,0.001c28.229,28.229,28.229,73.995,0,102.224 C121.385,177.841,75.617,177.841,47.388,149.612z';
  }

  sendFocus(event: MouseEvent): void {
    const firstEle: HTMLElement | null = (event.target as HTMLElement).parentElement;
    if (firstEle) {
      const secondEle: HTMLElement | null = firstEle.parentElement;
      if (secondEle) {
        ((secondEle as HTMLDivElement)
          .querySelector('input') as HTMLInputElement).focus();
      }
    }
  }
  chunk(r: any, j: number): any {
    // eslint-disable-next-line no-confusing-arrow
    return r.reduce((a, b, i, g) => !(i % j) ? a.concat([g.slice(i, i + j)]) : a, []);
  }
  unique(suggestions: Lulumi.CommandPalette.Suggestion[]): Lulumi.CommandPalette.Suggestion[] {
    let suggestionObjects: Lulumi.CommandPalette.SuggestionObject[] = [];
    const seen: Set<string> = new Set();

    suggestions.forEach((suggestion) => {
      suggestion.results.forEach((result) => {
        if (!seen.has(`${result.item.icon}:${result.item.url}`)) {
          seen.add(`${result.item.icon}:${result.item.url}`);
          suggestionObjects.push(result);
        }
      });
      suggestion.results = suggestionObjects;
      suggestionObjects = [];
    });
    return suggestions;
  }
  handleComposition(event: CompositionEvent): void {
    if (event.type === 'compositionend') {
      this.isComposing = false;
    } else {
      this.isComposing = true;
    }
  }
  debouncedInput(event: KeyboardEvent): void {
    const queryString: string = (event.target as HTMLInputElement).value;

    if (queryString === '') {
      (this.debouncedQuerySearch as any).cancel();
      this.hits!.isOpen = false;
      this.icon = '';
      this.value = '';
      this.spanValue = '';
      return;
    }
    this.value = queryString;
    this.debouncedQuerySearch(queryString);
  }
  async querySearch(queryString: string): Promise<void> {
    const ipc = this.$electron.ipcRenderer;
    const suggestions: Lulumi.CommandPalette.Suggestion[] = [];
    let suggestionObjects: Lulumi.CommandPalette.SuggestionObject[] = [];

    // browsingHistories
    const currentSearchEngine: string = this.currentSearchEngine.name;
    const navbarSearch = this.$t('hits.navbar.search');
    this.suggestionItems.forEach((item) => {
      item.icon = this.tabFavicon;
      suggestionObjects.push({ item });
    });

    suggestionObjects = suggestionObjects.filter(this.createFilter(queryString));
    suggestionObjects.push({
      item: {
        title: `${currentSearchEngine} ${navbarSearch}`,
        value: this.value,
        url: this.value,
        icon: 'search',
      },
    });
    if (suggestionObjects.length === 1 && urlUtil.isURL(this.value)) {
      suggestionObjects.unshift({
        item: {
          value: this.value,
          url: this.value,
          icon: this.tabFavicon,
        },
      });
    }

    // calling out fuse results using web workers
    const entries: Lulumi.CommandPalette.SuggestionObject[][] =
      await Promise.all(this.chunk(this.suggestionItemsByHistory, 10).map(
        suggestionItem => this.recommender.browsingHistories(
          suggestionItem, queryString.toLowerCase()
        )
      )) as any;
    if (entries.length !== 0) {
      entries.reduce((a, b) => a.concat(b)).forEach(entry => suggestionObjects.push(entry));
    }

    suggestions.push({
      header: 'Browsing History',
      icon: this.$store.getters.tabConfig.lulumiDefault.commandPalette.browsingHistory,
      results: suggestionObjects,
    });
    suggestionObjects = [];

    suggestions.push({
      header: 'Online Search',
      icon: this.$store.getters.tabConfig.lulumiDefault.commandPalette.onlineSearch,
      results: suggestionObjects,
    });

    // first results
    if (this.hits) {
      this.hits.suggestions = this.unique(suggestions);
      this.hits.highlightedIndex = '0-0';
      this.hits!.isOpen = true;
      const { item } = this.hits.suggestions[0].results[0];
      if (item.title !== undefined) {
        this.spanValue = item.title;
        this.icon = this.hits.suggestions[0].icon;
      }
    }

    // onlineSearch
    if (this.currentSearchEngine.autocomplete !== '') {
      const timestamp: number = Date.now();
      // autocomplete suggestions
      ipc.once(`fetch-search-suggestions-${timestamp}`, (event, result) => {
        if (result.ok) {
          const parsed = JSON.parse(result.body);
          const returnedSuggestions = (parsed[1] !== undefined)
            ? parsed[1]
            : parsed.items;
          returnedSuggestions.slice(0, 5).forEach((suggestion) => {
            suggestionObjects.push({
              item: {
                title: `${suggestion} - ${currentSearchEngine} ${navbarSearch}`,
                value: suggestion,
                url: suggestion,
                icon: 'search',
              },
            });
          });
          this.$nextTick(() => {
            if (this.hits) {
              suggestions[suggestions
                .findIndex(suggestion => suggestion.header === 'Online Search')]
                .results = suggestionObjects;
              this.hits.suggestions = this.unique(suggestions);
            }
          });
        } else {
          // eslint-disable-next-line no-console
          console.error(result.error);
        }
      });
      ipc.send(
        'fetch-search-suggestions',
        this.currentSearchEngine.autocomplete
          .replace('{queryString}', this.value)
          .replace('{language}', this.$store.getters.lang),
        timestamp
      );
    }

    const items = await this.recommender.onlineSearch(queryString);
    items.slice(0, 5).forEach((item) => {
      suggestionObjects.push({
        item: {
          title: `${item.full_name} - ${item.description}`,
          value: `${item.full_name} - ${item.description}`,
          url: item.html_url,
          icon: 'search',
        },
      });
    });

    if (this.hits) {
      suggestions[suggestions
        .findIndex(suggestion => suggestion.header === 'Online Search')]
        .results = suggestionObjects;
      this.hits.suggestions = this.unique(suggestions);
    }
  }
  createFilter(queryString: string): (suggestion: any) => boolean {
    return suggestion => (suggestion.item.value.indexOf(queryString.toLowerCase()) === 0);
  }
  highlight(index: string, direction: number): void {
    if (this.hits === null) {
      return;
    }
    if (index === '') {
      return;
    }

    this.loading = true;
    this.hits!.loading = true;
    this.$nextTick(() => {
      const [oldHIndex, oldIndex] = index.split('-', 2);
      let newHIndex = parseInt(oldHIndex, 10);
      let newIndex = parseInt(oldIndex, 10);
      if (direction > 0) {
        newIndex += 1;
      } else {
        newIndex -= 1;
      }
      if (newHIndex >= 0 && newHIndex < this.hits!.suggestions.length) {
        if (newIndex === this.hits!.suggestions[newHIndex].results.length) {
          newHIndex += 1;
          newIndex = 0;
        } else if (newIndex < 0) {
          newHIndex -= 1;
          newIndex = this.hits!.suggestions[newHIndex].results.length - 1;
        }
      }
      if (newHIndex === this.hits!.suggestions.length) {
        newHIndex -= 1;
        newIndex = this.hits!.suggestions[newHIndex].results.length - 1;
      } else if (newHIndex < 0) {
        newHIndex = 0;
        newIndex = 0;
      }

      const suggestion = this.hits!.$el.querySelector('.hit-list-container');
      if (suggestion !== null) {
        const header = suggestion.querySelector(
          'li.results-category > div.highlighted-header'
        ) as Element;
        const results = suggestion.querySelectorAll(
          `li.results-category:nth-child(${newHIndex + 1}) > ul > li.results-items`
        );

        const highlightItem = results[newIndex];
        const { scrollTop } = suggestion;
        const { offsetTop } = (highlightItem as HTMLDataListElement);

        if (offsetTop + highlightItem.scrollHeight > (scrollTop + suggestion.clientHeight)) {
          if (newHIndex !== parseInt(oldHIndex, 10)) {
            suggestion.scrollTop += header.clientHeight;
          }
          suggestion.scrollTop += highlightItem.scrollHeight;
        }
        if (offsetTop < scrollTop) {
          if (newHIndex !== parseInt(oldHIndex, 10)) {
            suggestion.scrollTop -= header.clientHeight;
          }
          suggestion.scrollTop -= highlightItem.scrollHeight;
        }
      }

      this.hits!.highlightedIndex = `${newHIndex}-${newIndex}`;
      this.icon = this.hits!.suggestions[newHIndex].icon;
      const { item } = this.hits!.suggestions[newHIndex].results[newIndex];
      if (item.title !== undefined) {
        this.spanValue = item.title;
      } else {
        this.spanValue = '';
      }
      this.loading = false;
      this.hits!.loading = false;
    });
  }
  handleKeyEnter(event: KeyboardEvent): void {
    if (!this.isComposing && this.hits && this.hits.highlightedIndex !== '') {
      const [hIndex, index] = this.hits.highlightedIndex.split('-', 2);
      if (parseInt(hIndex, 10) < this.hits.suggestions.length) {
        event.preventDefault();
        const { item } = this.hits.suggestions[parseInt(hIndex, 10)].results[parseInt(index, 10)];
        if (item.title !== undefined) {
          this.spanValue = item.title;
        }
        this.hits.select(item);
      }
    }
  }

  mounted(): void {
    this.recommender = Comlink.wrap(new Worker('recommender.js'));
    this.debouncedQuerySearch = debounce(this.querySearch, 250);
    this.hits = this.$parent.$refs.hits as Hits;

    this.$electron.ipcRenderer.on('send-focus', () => {
      this.focus = true;
    });
  }
}
</script>

<style lang="less" scoped>
.search-bar {
  display: flex;
  align-items: center;
  z-index: 10;
  height: 55px;
  position: relative;
  background-color: rgba(230,231,232,.97);
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

.search-icon {
  float: left;
  width: 22px;
  height: 22px;
  margin: 16.5px;
  position: static;
  background-size: cover;
}

.search-icon > svg {
  color: #a6a6a6;
}

.search-input {
  margin: 0;
  padding: 0;
  float: left;
  height: 55px;
  color: #333435;
  font-size: 1.7em;
  font-weight: 100;
  box-sizing: content-box;
  border: none !important;
  outline: none !important;
  background-color: transparent;
  -webkit-app-region: no-drag;
}

.description {
  flex: 1;
  color: #606162;
  font-size: 1.2em;
  padding: 0 50px 0 5px;
  overflow: hidden;
  white-space : nowrap;
  text-overflow: ellipsis;
}

.result-icon {
  position: absolute;
  top: 11.5px;
  right: 20px;
  line-height: 31px;
  height: 32px;
  width: 32px;
  font-size: 31px;
  color: #333435;
  background-size: cover;
}

.search-input:-ms-input-placeholder {
  color: #a6a6a6;
}
.search-input:-moz-placeholder {
  color: #a6a6a6;
}
.search-input::-moz-placeholder {
  color: #a6a6a6;
}
.search-input::-webkit-input-placeholder {
  color: #a6a6a6;
}
</style>
