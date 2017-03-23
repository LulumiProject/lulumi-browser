<template lang="pug">
  div
    h1 History
    el-button#history-clear(type="info", @click="setHistory(-1)") Clear
    ul(class="history-list")
      li(v-for="(entry, index) in history", :key="index", class="history-list__item")
        img(:src="entry.favicon")
        div(class="history-list__item-name") {{ entry.title }}
        | &nbsp;&nbsp;
        span
          a(class="history-list__item-link", :href="`${entry.url}`") {{ entry.url }}
</template>

<script>
  export default {
    data() {
      return {
        history: [],
        handler: null,
      };
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
      setHistory(index) {
        if (index !== -1) {
          this.history.splice(index, 1);
        } else {
          this.history = [];
        }
        // eslint-disable-next-line no-undef
        ipcRenderer.send('set-history', this.history);
      },
    },
    mounted() {
      // eslint-disable-next-line no-undef
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.history = ret;
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
  .history-list {
    margin-top: 10px;
    padding: 0;
    list-style: none;
  }
  .history-list__item {
    overflow: hidden;
    background-color: #fff;
    border: 1px solid #c0ccda;
    border-radius: 6px;
    box-sizing: border-box;
    margin: 10px 2px;
    padding: 5px 10px;
    width: auto;
    display: flex;
    align-items: center;
  }
  a.history-list__item-name:link {
    text-decoration: none;
  }
  a.history-list__item-name:hover {
    color: green;
    text-decoration: none;
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
</style>
