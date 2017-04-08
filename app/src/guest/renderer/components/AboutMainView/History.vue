<template lang="pug">
  div
    el-row(type="flex", align="middle")
      el-col(:span="4")
        h1 History
      el-col(:span="4")
        div {{ `History is ${sync === true ? 'syncing' : 'not syncing'}...&nbsp;` }}
        el-switch(@change="toggleSync", v-model="sync", on-color="#13ce66", off-color="#ff4949")
      el-col(:span="12")
        el-input#history-filter(@focus="toggleSync(false)", @blur="toggleSync(true)", placeholder="Input keyword", v-model="filterText")
      el-col(:span="2")
        el-button(:disabled="sync", type="info", @click="setHistory") Clear
    el-row
      el-col(:span="24")
        el-tree(ref="tree", empty-text="No data...", :data="data", :show-checkbox="true", :default-expand-all="true", :render-content="render", :filter-node-method="filterNode")
</template>

<script>
  import 'renderer/css/el-tree';

  export default {
    data() {
      return {
        history: [],
        data: [],
        handler: null,
        filterText: '',
        sync: true,
      };
    },
    watch: {
      filterText(val) {
        this.$refs.tree.filter(val);
      },
    },
    methods: {
      fetch() {
        this.handler = setInterval(() => {
          // eslint-disable-next-line no-undef
          ipcRenderer.send('guest-want-data', 'history');
        }, 1000);
      },
      clear() {
        clearInterval(this.handler);
      },
      toggleSync(val) {
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
      },
      setHistory() {
        const checkedNodes = this.$refs.tree.getCheckedNodes();
        if (checkedNodes.length) {
          checkedNodes.forEach((element) => {
            this.history[element.id].flag = true;
          });
          this.history = this.history.filter(element => element.flag === undefined);
          // this.$message.error('Not implemented...');
        } else {
          this.history = [];
        }
        // eslint-disable-next-line no-undef
        ipcRenderer.send('set-history', this.history);
      },
      filterNode(value, data) {
        if (!value) {
          return true;
        }
        if (data.children) {
          return data.label.toLowerCase().indexOf(value.toLowerCase()) !== -1;
        }
        return data.title.toLowerCase().indexOf(value.toLowerCase()) !== -1;
      },
      transformArr(history) {
        const newArr = [];
        const labels = {};
        let i;
        let j;
        let cur;
        let curLabel;
        for (i = 0, j = history.length; i < j; i++) {
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
      },
      render(h, node) {
        const history = node.data;
        if (history.children) {
          return h('span', history.label);
        }
        return h('span', { attrs: { class: 'history-list__item' } },
          [
            h('span', { attrs: { class: 'history-list__item-time' } }, history.time),
            h('img', { attrs: { src: history.favicon, width: '20px' } }),
            h('span', { attrs: { class: 'history-list__item-name' } }, history.title),
            h('a', { attrs: { href: history.url, class: 'history-list__item-link' } }, history.url),
          ],
        );
      },
    },
    mounted() {
      // eslint-disable-next-line no-undef
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.history = ret;
        this.data = this.transformArr(this.history);
      });
      this.fetch();
    },
    beforeDestroy() {
      this.clear();
      // eslint-disable-next-line no-undef
      ipcRenderer.removeAllListeners([
        'guest-here-your-data',
      ]);
    },
  };
</script>

<style>
  .history-list__item {
    display: inline-flex;
    align-items: center;
    width: 100vw;
  }
  a.history-list__item-link {
    background-size: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 50%;
  }
  a.history-list__item-link:hover {
    color: green;
  }
  .history-list__item-time {
    color: gray;
    padding-right: 30px;
  }
  .history-list__item-name {
    color: #48576a;
    padding: 0 4px;
    transition: color .3s;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 300px;
  }
</style>
