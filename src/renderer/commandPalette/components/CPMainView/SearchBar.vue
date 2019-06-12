<template lang="pug">
.search-bar(@click.self="sendFocus",
            @keydown.up.prevent="highlight(hits.highlightedIndex - 1)",
            @keydown.down.prevent="highlight(hits.highlightedIndex + 1)",
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
      path(d="M281.394,264.378l0.135-0.135L176.24,158.954c30.127-38.643,27.45-94.566-8.09-130.104 c-38.467-38.467-100.833-38.467-139.3,0c-38.467,38.467-38.466,100.833,0,139.299c35.279,35.279,90.644,38.179,129.254,8.748 l103.859,103.859c0.01,0.01,0.021,0.021,0.03,0.03l1.495,1.495l0.134-0.134c2.083,1.481,4.624,2.36,7.375,2.36 c7.045,0,12.756-5.711,12.756-12.756C283.753,269.002,282.875,266.462,281.394,264.378z M47.388,149.612 c-28.228-28.229-28.229-73.996,0-102.225c28.228-28.229,73.996-28.228,102.225,0.001c28.229,28.229,28.229,73.995,0,102.224 C121.385,177.841,75.617,177.841,47.388,149.612z")
  input(type="text",
        class="search-input",
        placeholder="Spotlight Search",
        @blur="focus = false",
        @input="querySearch",
        :value="value",
        v-focus="focus",
        v-autowidth="{maxWidth: '85vw'}")
  span.description(@click.self="sendFocus") {{ spanValue === '' ? '' : `- ${spanValue}` }}
  .result-icon(v-show="value !== ''")
    img(style="width: 32px; height: 32px;", :src="icon")
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Hits from './Hits.vue';

import * as Comlink from 'comlink';

import urlUtil from '../../../lib/url-util';
import config from '../../../mainBrowserWindow/constants';

@Component({
  name: 'search-bar',
  // https://vuejs.org/v2/guide/custom-directive.html
  directives: {
    focus: {
      // When the bound element is inserted into the DOM...
      update (el, { value }) {
        if (value) {
          // Focus the element
          el.focus();
        }
      },
    },
  },
})
export default class SearchBar extends Vue {
  value: string = '';
  spanValue: string = '';
  icon: string = '';
  focus: boolean = false;
  search: any;
  suggestionItems: Lulumi.Renderer.SuggestionItem[] = config.recommendTopSite;
  hits: Hits | null = null;

  get defaultFavicon(): string {
    return this.$store.getters.tabConfig.defaultFavicon;
  }
  get autoFetch(): boolean {
    return this.$store.getters.autoFetch;
  }
  get currentSearchEngine(): Lulumi.Store.SearchEngineObject {
    return this.$store.getters.currentSearchEngine;
  }
  get suggestionItemsByHistory(): any {
    const suggestionItems: Lulumi.Renderer.SuggestionItem[] = [];
    const regex = new RegExp('(^\w+:|^)\/\/');
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

  sendFocus(event): void {
    const firstEle: HTMLElement | null = (event.target as HTMLElement).parentElement;
    if (firstEle) {
      const secondEle: HTMLElement | null = firstEle.parentElement;
      if (secondEle) {
        ((secondEle as HTMLDivElement)
          .querySelector('input') as HTMLInputElement).focus();
      }
    }
  }
  chunk(r: any[], j: number): any[][] {
    return r.reduce((a,b,i,g) => !(i % j) ? a.concat([g.slice(i,i+j)]) : a, []);
  }
  unique(suggestions: Lulumi.Renderer.SuggestionObject[]): Lulumi.Renderer.SuggestionObject[] {
    const newSuggestions: Lulumi.Renderer.SuggestionObject[] = [];
    const seen: Set<string> = new Set();

    suggestions.forEach((suggestion) => {
      if (!seen.has(`${suggestion.item.icon}:${suggestion.item.url}`)) {
        seen.add(`${suggestion.item.icon}:${suggestion.item.url}`);
        newSuggestions.push(suggestion);
      }
    });
    return newSuggestions;
  }
  async querySearch(event): Promise<void> {
    const queryString: string = event.target.value;
    const ipc = this.$electron.ipcRenderer;
    const currentSearchEngine: string = this.currentSearchEngine.name;
    const navbarSearch = this.$t('navbar.search');
    let suggestions: Lulumi.Renderer.SuggestionObject[] = [];
    this.suggestionItems.forEach((item) => {
      item.icon = this.defaultFavicon;
      suggestions.push({ item });
    });
    if (queryString === '') {
      this.hits!.suggestions = [];
      this.value = '';
      this.spanValue = '';
      return;
    }
    this.value = queryString;
    suggestions = suggestions.filter(this.createFilter(queryString));
    suggestions.push({
      item: {
        title: `${currentSearchEngine} ${this.$t('navbar.search')}`,
        value: this.value,
        url: this.value,
        icon: 'search',
      },
    });
    if (suggestions.length === 1 && urlUtil.isURL(this.value)) {
      suggestions.unshift({
        item: {
          value: this.value,
          url: this.value,
          icon: this.defaultFavicon,
        },
      });
    }

    // calling out fuse results using web workers
    const entries: Lulumi.Renderer.SuggestionObject[][]
      = await Promise.all(this.chunk(this.suggestionItemsByHistory, 10)
        .map(suggestionItem => this.search(suggestionItem, queryString.toLowerCase()))) as any;
    if (entries.length !== 0) {
      entries.reduce((a, b) => a.concat(b)).forEach(entry => suggestions.push(entry));
    }

    if (this.autoFetch && this.currentSearchEngine.autocomplete !== '') {
      const timestamp: number = Date.now();
      // autocomplete suggestions
      ipc.once(`fetch-search-suggestions-${timestamp}`, (event, result) => {
        if (result.ok) {
          const parsed = JSON.parse(result.body);
          const returnedSuggestions = (parsed[1] !== undefined)
            ? parsed[1]
            : parsed.items;
          returnedSuggestions.forEach((suggestion) => {
            suggestions.push({
              item: {
                title: `${currentSearchEngine} ${navbarSearch}`,
                value: suggestion,
                url: suggestion,
                icon: 'search',
              },
            });
          });
        } else {
          // tslint:disable-next-line no-console
          console.error(result.error);
        }
        if (this.hits) {
          this.hits.suggestions = this.unique(suggestions);
          this.hits.highlightedIndex = 0;
          const item = this.hits.suggestions[0].item;
          if (item.title !== undefined) {
            this.spanValue = item.title;
            this.icon = item.icon;
          }
        }
      });
      ipc.send(
        'fetch-search-suggestions',
        currentSearchEngine,
        this.currentSearchEngine.autocomplete
        .replace('{queryString}', this.value)
        .replace('{language}', this.$store.getters.lang),
        timestamp);
    } else {
      if (this.hits) {
        this.hits.suggestions = this.unique(suggestions);
        this.hits.highlightedIndex = 0;
        const item = this.hits.suggestions[0].item;
        if (item.title !== undefined) {
          this.spanValue = item.title;
          this.icon = item.icon;
        }
      }
    }
  }
  createFilter(queryString: string): (suggestion: any) => boolean {
    return suggestion => (suggestion.item.value.indexOf(queryString.toLowerCase()) === 0);
  }
  highlight(index) {
    if (this.hits === null) {
      return;
    }
    if (index < 0) {
      this.hits.highlightedIndex = 0;
      return;
    }
    let newIndex = index;
    if (index >= this.hits.suggestions.length) {
      newIndex = this.hits.suggestions.length - 1;
    }
    this.hits.highlightedIndex = newIndex;
    const item = this.hits.suggestions[this.hits.highlightedIndex].item;
    if (item.title !== undefined) {
      this.spanValue = item.title;
      this.icon = item.icon;
    } else {
      this.spanValue = '';
      this.icon = '';
    }
  }
  handleKeyEnter(event) {
    if (this.hits && this.hits.highlightedIndex >= 0
      && this.hits.highlightedIndex < this.hits.suggestions.length) {
      event.preventDefault();
      const item = this.hits.suggestions[this.hits.highlightedIndex].item;
      if (item.title !== undefined) {
        this.value = item.value;
        this.spanValue = item.title;
      }
      this.hits.select(item);
    }
  }

  mounted() {
    this.search = Comlink.wrap(new Worker('search-worker.js'));
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
