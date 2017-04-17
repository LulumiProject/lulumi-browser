<template lang="pug">
  div
    el-row(type="flex", align="middle")
      el-col(:span="12")
        h1 Extensions
    el-row
      el-col(:span="24")
        ul(class="extensions-list")
          li(v-for="extension in Object.keys(extensions)", :key="extension", class="extensions-list__item")
            a(class="extensions-list__item-name extensions-list__item-link")
              i(class="el-icon-document") {{ extension }}
            el-button(:plain="true", type="info", size="small", icon="more", @click="openDevTools(extensions[extension].webContentsId)")
</template>

<script>
  export default {
    computed: {
      extensions() {
        return this.$store.getters.extensions;
      },
    },
    methods: {
      openDevTools(webContentsId) {
        // eslint-disable-next-line no-undef
        ipcRenderer.send('open-dev-tools', webContentsId);
      },
    },
  };
</script>

<style>
  .extensions-list {
    margin-top: 10px;
    padding: 0;
    list-style: none;
  }
  .extensions-list__item {
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
    justify-content: space-around;
  }
  a.extensions-list__item-link {
    text-decoration: none;
  }
  a.extensions-list__item-link:hover {
    color: green;
  }
  .extensions-list__item-name {
    color: #48576a;
    padding-left: 4px;
    transition: color .3s;
    flex: 5;
  }
  .extensions-list__item-name > i {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 400px;
  }
  .extensions-list__item-progress {
    right: 0;
    flex: 1;
  }
</style>
