<template lang="pug">
  div
    el-row(type="flex", align="middle")
      el-col(:span="12")
        h1 {{ $t('about.extensionsPage.title') }}
      el-col(:span="6", :offset="3")
        el-button(type="info", @click="addExtension") {{ $t('about.extensionsPage.add') }}
    el-row
      el-col(:span="24")
        ul(class="extensions-list")
          li(v-for="extension in Object.keys(extensions)", :key="extension", class="extensions-list__item")
            el-button(:plain="true", type="danger", size="small", icon="circle-cross", @click="removeExtension(extension)")
            a(v-if="extensions[extension].webContentsId !== undefined", class="extensions-list__item-name extensions-list__item-link", @click.prevent="openDevTools(extensions[extension].webContentsId)")
              img(:src="loadIcon(extension)", style="width: 32px; margin-left: -30px; padding-right: 15px;")
              | {{ loadName(extension) }}
            span(v-else, class="extensions-list__item-name")
              img(v-if="loadIcon(extension) !== undefined", :src="loadIcon(extension)", style="width: 32px; margin-left: -30px; padding-right: 15px;")
              span(v-else)
              | {{ loadName(extension) }}
            div
              | {{ `${$t('about.extensionsPage.path')} ` }}
              span(class="extensions-list__item-path") {{ loadPath(extension) }}
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  interface RenderProcessPreference {
    name: string;
    extensionId: string;
    icons: Array<string>;
    srcDirectory: string;
  }
  interface RenderProcessPreferences {
    [index: number]: RenderProcessPreference;
    findIndex: (element: any) => number;
  }
  interface Window {
    renderProcessPreferences: RenderProcessPreferences,
    location: {
      reload: () => void;
    };
  };

  declare const ipcRenderer: Electron.IpcRenderer;
  declare const window: Window;

  @Component
  export default class Extensions extends Vue {
    get extensions() {
      return this.$store.getters.extensions;
    }

    findId(extensionId: string): number {
      return window.renderProcessPreferences
        .findIndex(element => element.extensionId === extensionId);
    }
    loadName(extensionId: string): string {
      const id: number = this.findId(extensionId);
      return window.renderProcessPreferences[id].name;
    }
    loadIcon(extensionId: string): string | undefined {
      const id: number = this.findId(extensionId);
      if (window.renderProcessPreferences[id].icons) { // manifest.icons entry is optional
        return (Object as any).values(window.renderProcessPreferences[id].icons)[0];
      }
      return undefined;
    }
    loadPath(extensionId: string): string {
      const id = this.findId(extensionId);
      return `file://${window.renderProcessPreferences[id].srcDirectory}/`;
    }
    openDevTools(webContentsId: number): void {
      ipcRenderer.send('open-dev-tools', webContentsId);
    }
    addExtension(): void {
      ipcRenderer.once('add-extension-result', () => {
        window.location.reload();
      });
      ipcRenderer.send('add-extension');
    }
    removeExtension(extensionId: string): void {
      const id = this.findId(extensionId);
      ipcRenderer.once('remove-extension-result', (event, result) => {
        if (result === 'OK') {
          window.location.reload();
        }
      });
      ipcRenderer.send('remove-extension', window.renderProcessPreferences[id].name);
      window.location.reload();
    }
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
