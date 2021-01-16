<template lang="pug">
div
  el-row(type="flex", align="middle")
    el-col(:span="4")
      h1 {{ $t('about.historyPage.title') }}
    el-col(:span="4")
      div {{ `${$t('about.historyPage.sync')} ${syncStatus()}` }}
      el-switch(@change="toggleSync",
                v-model="sync",
                active-color="#13ce66",
                inactive-color="#ff4949")
    el-col(:span="12")
      el-input#history-filter(@focus="toggleSync(false)",
                              @blur="toggleSync(true)",
                              :placeholder="$t('about.historyPage.placeholder')",
                              v-model="filterText")
    el-col(:span="2")
      el-button(:disabled="sync",
                type="danger",
                size="medium",
                @click="setHistory") {{ $t('about.historyPage.clear') }}
  el-row
    el-col(:span="24")
      el-tree(ref="tree",
              :empty-text="$t('about.historyPage.noData')",
              :data="data",
              :show-checkbox="true",
              :default-expand-all="true",
              :render-content="customRender",
              :filter-node-method="filterNode")
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Watch, Vue } from 'vue-property-decorator';
import { CreateElement, VNode } from 'vue';

import { Button, Col, Input, Row, Switch, Tree } from 'element-ui';

interface HistoryItem {
  id: number;
  title: string;
  label: string;
  favIconUrl: string;
  url: string;
  time: string;
  flag: boolean;
  children: HistoryItem[];
}

interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
  URL: any;
}

declare const window: Window;

@Component({
  components: {
    'el-button': Button,
    'el-col': Col,
    'el-input': Input,
    'el-row': Row,
    'el-switch': Switch,
    'el-tree': Tree,
  },
})
export default class History extends Vue {
  history: HistoryItem[] = [];
  data: HistoryItem[] = [];
  handler: any = null;
  filterText = '';
  sync = false;

  @Watch('filterText')
  onFilterText(val: string): void {
    (this.$refs.tree as any).filter(val);
  }

  fetch(): void {
    this.handler = setInterval(
      () => {
        window.ipcRenderer.send('guest-want-data', 'history');
      },
      1000
    );
  }
  clear(): void {
    clearInterval(this.handler);
  }
  toggleSync(val: boolean): void {
    if (val) {
      if (!this.handler) {
        this.fetch();
      } else {
        this.clear();
        this.fetch();
      }
    } else {
      this.clear();
    }
  }
  syncStatus(): string {
    if (this.sync) {
      return this.$t('about.historyPage.syncStatus.syncing') as string;
    }
    return this.$t('about.historyPage.syncStatus.notSyncing') as string;
  }
  setHistory(): void {
    const checkedNodes = (this.$refs.tree as any).getCheckedNodes();
    if (checkedNodes.length) {
      checkedNodes.forEach((element) => {
        this.history[element.id].flag = true;
      });
      this.history = this.history.filter(element => element.flag === undefined);
      // this.$message.error('Not implemented...');
    } else {
      this.history = [];
    }
    window.ipcRenderer.send('set-history', this.history);
  }
  filterNode(value: string, data: HistoryItem): boolean {
    if (!value) {
      return true;
    }
    if (data.children) {
      return data.label.toLowerCase().includes(value.toLowerCase());
    }
    return data.title.toLowerCase().includes(value.toLowerCase());
  }
  transformArr(history: HistoryItem[]): HistoryItem[] {
    const newArr: HistoryItem[] = [];
    const labels: any = {};
    let i: number;
    let j: number;
    let cur: HistoryItem;
    let curLabel: string;
    for (i = 0, j = history.length; i < j; i += 1) {
      cur = history[i];
      curLabel = cur.label;
      if (!(curLabel in labels)) {
        labels[curLabel] = { label: curLabel, time: cur.time, children: [], id: i };
        newArr.push(labels[curLabel]);
      }
      cur.id = i;
      labels[curLabel].children.push(cur);
    }
    return newArr;
  }
  getHostname(input: string, excludePort = false): string | null {
    try {
      if (excludePort) {
        return new window.URL(input).hostname;
      }
      return new window.URL(input).host;
    } catch (e) {
      return null;
    }
  }
  customRender(h: CreateElement, node: any): VNode {
    const history: HistoryItem = node.data;
    if (history.children) {
      return h('span', history.label);
    }
    return h(
      'span',
      {
        attrs: { class: 'history-list__item' },
      },
      [
        h('span', { attrs: { class: 'history-list__item-time' } }, history.time),
        h('img', { attrs: { src: history.favIconUrl, width: '18px' } }),
        h('span', { attrs: { class: 'history-list__item-name' } }, history.title),
        h('a',
          { attrs: { href: history.url, class: 'history-list__item-link' } },
          this.getHostname(history.url)),
      ],
    );
  }

  mounted(): void {
    window.ipcRenderer.on('guest-here-your-data', (event, ret) => {
      this.history = ret;
      this.data = this.transformArr(this.history);
    });
    // fetch once when the component is mounted
    window.ipcRenderer.send('guest-want-data', 'history');
  }
  beforeDestroy(): void {
    this.clear();
    window.ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>

<style lang="less">
.el-tree-node.is-expanded {
  .el-tree-node__children {
    display: flex;
    flex-direction: column;
  }
  .el-tree-node__content {
    display: flex;
    align-items: center;
  }
}

.history-list__item {
  display: inline-flex;
  align-items: center;
  width: 90vw;

  .history-list__item-time {
    width: 100px;
    color: gray;
    padding-right: 30px;
  }
  .history-list__item-name {
    width: 70%;
    color: #48576a;
    padding: 0 4px;
    transition: color .3s;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  a.history-list__item-link {
    background-size: 0;
    text-overflow: ellipsis;
    overflow: hidden;

    &:hover {
      color: green;
    }
  }
}
</style>
