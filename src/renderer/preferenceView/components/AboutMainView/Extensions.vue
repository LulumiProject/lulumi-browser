<template lang="pug">
div
  el-row(type="flex", align="middle")
    el-col(:span="12")
      h1 {{ $t('about.extensionsPage.title') }}
    el-col(:span="6", :offset="3")
      el-button(type="success",
                size="medium",
                @click="addLulumiExtension") {{ $t('about.extensionsPage.add') }}
  el-row
    el-col(:span="24")
      ul(class="extensions-list")
        li(v-for="extension in Object.keys(extensions)",
           :key="extension",
           class="extensions-list__item")
          el-button(:plain="true",
                    type="danger",
                    size="mini",
                    icon="el-icon-close",
                    @click="removeLulumiExtension(extension)")
          a(v-if="extensions[extension].webContentsId !== undefined",
            class="extensions-list__item-name extensions-list__item-link",
            @click.prevent="openDevTools(extensions[extension].webContentsId)")
            img(:src="loadIcon(extension)",
                style="width: 32px; margin-left: -30px; padding-right: 15px;")
            | {{ loadName(extension) }}
          span(v-else, class="extensions-list__item-name")
            img(v-if="loadIcon(extension) !== undefined",
                :src="loadIcon(extension)",
                style="width: 32px; margin-left: -30px; padding-right: 15px;")
            span(v-else)
            | {{ loadName(extension) }}
          div
            | {{ `${$t('about.extensionsPage.path')} ` }}
            span(class="extensions-list__item-path") {{ loadPath(extension) }}
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import { Button, Col, Row } from 'element-ui';

interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
  location: {
    reload: () => void;
  };
}

declare const window: Window;

@Component({
  components: {
    'el-button': Button,
    'el-col': Col,
    'el-row': Row,
  },
})
export default class Extensions extends Vue {
  get extensions(): any {
    return this.$store.getters.extensions;
  }

  findId(extensionId: string): number {
    return window.data.renderProcessPreferences
      .findIndex(element => element.extensionId === extensionId);
  }
  loadName(extensionId: string): string {
    const id: number = this.findId(extensionId);
    return window.data.renderProcessPreferences[id].name;
  }
  loadIcon(extensionId: string): string | undefined {
    const id: number = this.findId(extensionId);
    if (window.func.join &&
      window.func.createFromPath &&
      window.data.renderProcessPreferences[id].icons) {
      return window.func.createFromPath(window.func.join(
        window.data.renderProcessPreferences[id].srcDirectory,
        Object.values(window.data.renderProcessPreferences[id].icons)[0]
      )).toDataURL();
    }
    return undefined;
  }
  loadPath(extensionId: string): string {
    const id = this.findId(extensionId);
    return `file://${window.data.renderProcessPreferences[id].srcDirectory}/`;
  }
  openDevTools(webContentsId: number): void {
    window.ipcRenderer.send('open-dev-tools', webContentsId);
  }
  addLulumiExtension(): void {
    window.ipcRenderer.once(
      'add-lulumi-extension-result',
      (event, data: any): void => {
        if (data.result === 'OK') {
          window.location.reload();
        } else {
          this.$message.error(data.result);
        }
      }
    );
    window.ipcRenderer.send('add-lulumi-extension');
  }
  removeLulumiExtension(extensionId: string): void {
    const id = this.findId(extensionId);
    window.ipcRenderer.once(
      'remove-lulumi-extension-result',
      (event, data: any): void => {
        if (data.result === 'OK') {
          window.location.reload();
        } else {
          this.$message.error(data.result);
        }
      }
    );
    window.ipcRenderer.send(
      'remove-lulumi-extension',
      window.data.renderProcessPreferences[id].extensionId
    );
  }
}
</script>

<style lang="less">
.extensions-list {
  margin-top: 10px;
  padding: 0;
  list-style: none;

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

    .el-button--mini {
      padding: 4px 4px;
    }
    .extensions-list__item-name {
      color: #48576a;
      transition: color .3s;
      flex: 5;

      i {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        height: 20px;
        width: 400px;
      }
    }
    a.extensions-list__item-link {
      font-size: 20px;
      bottom: 10px;
      cursor: pointer;
      text-decoration: none;
      background-image: none;

      &:hover {
        color: green;
      }
    }
    .extensions-list__item-path {
      font-size: 14px;
      color: gray;
    }
    .extensions-list__item-progress {
      right: 0;
      flex: 1;
    }
  }
}
</style>
