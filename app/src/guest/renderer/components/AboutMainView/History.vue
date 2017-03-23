<template lang="pug">
  div
    h1 History
    el-button#history-clear(type="info", @click="setHistory(-1)") Clear
    div {{ `History is ${sync === true ? 'syncing' : 'not syncing'}...&nbsp;` }}
    el-switch(@change="toggleSync", v-model="sync", on-color="#13ce66", off-color="#ff4949")
    el-input#history-filter(@focus="toggleSync(false)", @blur="toggleSync(true)", placeholder="Input keyword", v-model="filterText")
    el-tree(ref="tree", empty-text="No data...", :data="data", :show-checkbox="true", :default-expand-all="true", :render-content="render", :filter-node-method="filterNode")
</template>

<script>
  import '../../css/el-tree';

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
      setHistory(index) {
        if (index !== -1) {
          this.history.splice(index, 1);
        } else {
          const checkedNodes = this.$refs.tree.getCheckedNodes();
          if (checkedNodes.length) {
            this.$message.error('Not implemented...');
          } else {
            this.history = [];
          }
        }
        // eslint-disable-next-line no-undef
        ipcRenderer.send('set-history', this.history);
      },
      filterNode(value, data) {
        if (!value) {
          return true;
        }
        if (data.children) {
          return data.label.toLowerCase().indexOf(value) !== -1;
        }
        return data.title.toLowerCase().indexOf(value) !== -1;
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
            labels[curLabel] = { label: curLabel, children: [] };
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
    width: 30%;
  }
  a.history-list__item-link:hover {
    color: green;
  }
  .history-list__item-name {
    color: #48576a;
    padding-left: 4px;
    transition: color .3s;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 60%;
  }
  #history-clear {
    top: 10px;
    right: 50px;
    position: absolute;
  }
  #history-filter {
    top: 10px;
    right: 400px;
    width: 350px;
    position: absolute;
  }
</style>
