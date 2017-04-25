<template lang="pug">
  div
    el-row(type="flex", align="middle")
      el-col(:span="12")
        h1 Extensions
      el-col(:span="6", :offset="3")
        el-button(type="info", @click="addExtension") Add
    el-row
      el-col(:span="24")
        ul(class="extensions-list")
          li(v-for="extension in Object.keys(extensions)", :key="extension", class="extensions-list__item")
            el-button(:plain="true", type="danger", size="small", icon="circle-cross", @click="removeExtension(extension)")
            a(v-if="extensions[extension].webContentsId !== undefined", class="extensions-list__item-name extensions-list__item-link", @click.prevent="openDevTools(extensions[extension].webContentsId)")
              img(:src="loadIcon(extension)", style="width: 32px; margin-left: -30px; padding-right: 15px;")
              | {{ loadName(extension) }}
            span(v-else, class="extensions-list__item-name")
              img(:src="loadIcon(extension)", style="width: 32px; margin-left: -30px; padding-right: 15px;")
              | {{ loadName(extension) }}
            div
              | {{ "Path: " }}
              span(class="extensions-list__item-path") {{ loadPath(extension) }}
</template>

<script>
  export default {
    computed: {
      extensions() {
        return this.$store.getters.extensions;
      },
    },
    methods: {
      loadName(extensionId) {
        // eslint-disable-next-line no-undef
        const id = window.renderProcessPreferences
          .findIndex(element => element.extensionId === extensionId);
        return window.renderProcessPreferences[id].name;
      },
      loadIcon(extensionId) {
        // eslint-disable-next-line no-undef
        const id = window.renderProcessPreferences
          .findIndex(element => element.extensionId === extensionId);
        return window.renderProcessPreferences[id].icons['16'];
      },
      loadPath(extensionId) {
        // eslint-disable-next-line no-undef
        const id = window.renderProcessPreferences
          .findIndex(element => element.extensionId === extensionId);
        return `file://${window.renderProcessPreferences[id].srcDirectory}/`;
      },
      openDevTools(webContentsId) {
        // eslint-disable-next-line no-undef
        ipcRenderer.send('open-dev-tools', webContentsId);
      },
      addExtension() {
        // eslint-disable-next-line no-undef
        ipcRenderer.once('add-extension-result', () => {
          window.location.reload();
        });
        // eslint-disable-next-line no-undef
        ipcRenderer.send('add-extension');
      },
      removeExtension(extensionId) {
        // eslint-disable-next-line no-undef
        const id = window.renderProcessPreferences
          .findIndex(element => element.extensionId === extensionId);
        // eslint-disable-next-line no-undef
        ipcRenderer.once('remove-extension-result', (event, result) => {
          if (result === 'OK') {
            window.location.reload();
          }
        });
        // eslint-disable-next-line no-undef
        ipcRenderer.send('remove-extension', window.renderProcessPreferences[id].name);
        window.location.reload();
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
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
  }
  .extensions-list__item-path {
    font-size: 14px;
    color: gray;
  }
  a.extensions-list__item-link {
    font-size: 20px;
    bottom: 10px;
    cursor: pointer;
    text-decoration: none;
    background-image: none;
  }
  a.extensions-list__item-link:hover {
    color: green;
  }
  .extensions-list__item-name {
    color: #48576a;
    transition: color .3s;
    flex: 5;
  }
  .extensions-list__item-name > i {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    height: 20px;
    width: 400px;
  }
  .extensions-list__item-progress {
    right: 0;
    flex: 1;
  }
</style>
