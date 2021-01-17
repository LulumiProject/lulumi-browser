<template lang="pug">
transition(name="download-bar")
  #download-bar
    ul(class="download-list")
      el-popover(placement="top-start",
                 width="178",
                 trigger="hover",
                 popper-class="download-list__popper"
        v-for="(file, index) in files", :key="index")
        div {{ showState(file.dataState) }}
        el-button-group(v-show="checkStateForButtonGroup(file.dataState)")
          el-button(:disabled="file.dataState !== 'progressing'",
                    v-if="file.isPaused && file.canResume",
                    :plain="true",
                    type="warning",
                    size="mini",
                    icon="el-icon-caret-right",
                    @click="resumeDownload(file.startTime)")
          el-button(:disabled="file.dataState !== 'progressing'",
                    v-else,
                    :plain="true",
                    type="warning",
                    size="mini",
                    icon="el-icon-minus",
                    @click="pauseDownload(file.startTime)")
          el-button(:disabled="file.dataState !== 'progressing'",
                    :plain="true",
                    type="danger",
                    size="mini",
                    icon="el-icon-circle-close",
                    @click="cancelDownload(file.startTime)")
          el-button(:disabled="file.dataState === 'cancelled'",
                    :plain="true",
                    type="info",
                    size="mini",
                    icon="el-icon-document",
                    @click="showItemInFolder(file.savePath)")
        li(class="download-list__item", slot="reference")
          div(class="download-list__item-panel")
            div(class="ellipsis")
              img(:fetch="getFileIcon(file.savePath, index)", :id="`icon-${index}`")
              a(class="download-list__item-name",
                href='#',
                @click.prevent="openPath(file.savePath)")
                | {{ file.name }}
            span(class="download-list__item-description") {{ progress(file) }}
          el-progress(:status="checkStateForProgress(file.dataState)",
                      type="circle",
                      :percentage="percentage(file)",
                      :width="30",
                      :stroke-width="3",
                      class="download-list__item-progress")
    span#download-bar-close(class="el-icon-close", @click="closeDownloadBar")
</template>

<script lang="ts">
/* global Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import { Button, ButtonGroup, Progress, Popover } from 'element-ui';

import prettySize from '../../../lib/pretty-size';
import imageUtil from '../../../lib/image-util';

import BrowserMainView from '../BrowserMainView.vue';

/* eslint-disable import/no-unresolved */
import '../../css/el-progress';
import '../../css/el-popover';
/* eslint-enable import/no-unresolved */

@Component({
  components: {
    'el-button-group': ButtonGroup,
    'el-button': Button,
    'el-progress': Progress,
    'el-popover': Popover,
  },
})

export default class Download extends Vue {
  get files(): any {
    let tmpFiles: any = [];
    if (this.$store.getters.downloads.length !== 0) {
      tmpFiles = this.$store.getters.downloads.filter(download => download.style !== 'hidden');
      tmpFiles.forEach((file) => {
        (file as any).totalSize = prettySize.process((file as any).totalBytes);
      });
    }

    return tmpFiles;
  }

  progress(file: Lulumi.Store.DownloadItem): string {
    if (file.dataState === 'progressing') {
      return `${this.prettyReceivedSize(file.getReceivedBytes)}/${file.totalBytes}`;
    }

    return this.showState(file.dataState);
  }
  showState(dataState: string): string {
    return this.$t(`downloads.state.${dataState}`) as string;
  }
  prettyReceivedSize(size: number): string {
    return prettySize.process(size);
  }
  percentage(file: Lulumi.Store.DownloadItem): number {
    return (file.getReceivedBytes / file.totalBytes) * 100 || 0;
  }
  showItemInFolder(savePath: string): void {
    this.$electron.ipcRenderer.send('show-item-in-folder', savePath);
  }
  openPath(savePath: string): void {
    this.$electron.ipcRenderer.send('open-path', savePath);
  }
  checkStateForButtonGroup(state: string): boolean {
    switch (state) {
      case 'cancelled':
      case 'interrupted':
        return false;
      case 'progressing':
      case 'completed':
      default:
        return true;
    }
  }
  checkStateForProgress(state: string): string {
    switch (state) {
      case 'progressing':
        return '';
      case 'cancelled':
      case 'interrupted':
        return 'exception';
      case 'completed':
      default:
        return 'success';
    }
  }
  pauseDownload(startTime: number): void {
    this.$electron.ipcRenderer.send('pause-downloads-progress', startTime);
  }
  resumeDownload(startTime: number): void {
    this.$electron.ipcRenderer.send('resume-downloads-progress', startTime);
  }
  cancelDownload(startTime: number): void {
    this.$electron.ipcRenderer.send('cancel-downloads-progress', startTime);
  }
  closeDownloadBar(): void {
    (this.$parent as BrowserMainView).onCloseDownloadBar();
  }
  getFileIcon(savePath: string, index: number): void {
    if (savePath) {
      imageUtil.getBase64FromFileIcon(savePath, 'normal').then((dataURL) => {
        if (dataURL) {
          const el = document.getElementById(`icon-${index}`);
          if (el) {
            el.setAttribute('src', dataURL);
          }
        }
      });
    }
  }
}
</script>

<style scoped>
#download-bar {
  background: #F3F3F3;
  border-color: #d3d3d3;
  border-style: solid;
  border-width: 1px 1px 0 0;
  bottom: 0;
  color: #555555;
  font-size: 18px;
  left: 0;
  width: 100vw;
  overflow-x: hidden;
  padding: 0.2em 0.5em;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
#download-bar-close {
  font-size: 13px;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
}
#download-bar-close:before {
  transform: scale(.7);
}
#download-bar-close:hover {
  background: rgba(189, 189, 189, 0.57);
  transform: rotate(10deg);
}
.download-bar-enter-active, .download-bar-leave-active {
  transition: opacity .5s;
}
.download-bar-enter, .download-bar-leave-active {
  opacity: 0
}

.download-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
}
.download-list__item {
  overflow: hidden;
  background-color: #fff;
  border: 1px solid #c0ccda;
  border-radius: 6px;
  box-sizing: border-box;
  margin: 0 2px;
  padding: 5px 0;
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.download-list__item-panel {
  display: flex;
  flex-direction: column;
}
.download-list__item-name {
  color: #48576a;
  padding-left: 4px;
  transition: color .3s;
  font-size: 13px;
  width: 120px;
}
.download-list__item-description {
  font-size: 13px;
}
.download-list__item-progress {
  right: 0;
}
.ellipsis {
  display: block;
  overflow: hidden;
  width: 168px;
  height: 32px;
}
.ellipsis:after {
  content:"";
  float: right;
  position: relative;
  top: -20px;
  left: 70%;
  width: 3px;
  text-align: right;
}
.ellipsis > img {
  float: left;
  width: 32px;
}
.ellipsis > a {
  width: 132px;
  float: right;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
