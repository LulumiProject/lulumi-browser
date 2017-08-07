<template lang="pug">
  transition(name="download-bar")
    #download-bar
      ul(class="download-list")
        el-popover(placement="top-start", width="178", trigger="hover", popper-class="download-list__popper"
          v-for="(file, index) in files", :key="index")
          div {{ showState(file.dataState) }}
          el-button-group(v-show="checkStateForButtonGroup(file.dataState)")
            el-button(:disabled="file.dataState !== 'progressing'", v-if="file.isPaused && file.canResume", :plain="true", type="warning", size="mini", icon="caret-right", @click="resumeDownload(file.startTime)")
            el-button(:disabled="file.dataState !== 'progressing'", v-else, :plain="true", type="warning", size="mini", icon="minus", @click="pauseDownload(file.startTime)")
            el-button(:disabled="file.dataState !== 'progressing'", :plain="true", type="danger", size="mini", icon="circle-close", @click="cancelDownload(file.startTime)")
            el-button(:disabled="file.dataState === 'cancelled'", :plain="true", type="info", size="mini", icon="document", @click="showItemInFolder(file.savePath)")
          li(class="download-list__item", slot="reference")
            div(class="download-list__item-panel")
              div(class="ellipsis")
                img(:fetch="getFileIcon(file.savePath, index)", :id="`icon-${index}`")
                a(class="download-list__item-name", href='#', @click.prevent="openItem(file.savePath)")
                  | {{ file.name }}
              span(class="download-list__item-description") {{ file.dataState === 'progressing' ? `${prettyReceivedSize(file.getReceivedBytes)}/${file.totalSize}`: showState(file.dataState) }}
            el-progress(:status="checkStateForProgress(file.dataState)", type="circle", :percentage="percentage(file)", :width="30", :stroke-width="3", class="download-list__item-progress")
      span#download-bar-close(class="el-icon-close", @click="closeDownloadBar")
</template>

<script>
  import { Button, ButtonGroup, Progress, Popover } from 'element-ui';

  import '../../css/el-progress';
  import '../../css/el-popover';
  import prettySize from '../../js/lib/pretty-size';
  import imageUtil from '../../js/lib/image-util';

  export default {
    components: {
      'el-button-group': ButtonGroup,
      'el-button': Button,
      'el-progress': Progress,
      'el-popover': Popover,
    },
    computed: {
      files() {
        let tmpFiles = [];
        if (this.$store.getters.downloads.length !== 0) {
          tmpFiles = this.$store.getters.downloads.filter(download => download.style !== 'hidden');
          tmpFiles.forEach((file) => {
            file.totalSize = prettySize.process(file.totalBytes);
          });
        }
        return tmpFiles;
      },
    },
    methods: {
      showState(dataState) {
        return this.$t(`downloads.state.${dataState}`);
      },
      prettyReceivedSize(size) {
        return prettySize.process(size);
      },
      percentage(file) {
        return parseInt((file.getReceivedBytes / file.totalBytes) * 100, 10) || 0;
      },
      showItemInFolder(savePath) {
        this.$electron.ipcRenderer.send('show-item-in-folder', savePath);
      },
      openItem(savePath) {
        this.$electron.ipcRenderer.send('open-item', savePath);
      },
      checkStateForButtonGroup(state) {
        switch (state) {
          case 'cancelled':
          case 'interrupted':
            return false;
          case 'progressing':
          case 'completed':
          default:
            return true;
        }
      },
      checkStateForProgress(state) {
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
      },
      pauseDownload(startTime) {
        this.$electron.ipcRenderer.send('pause-downloads-progress', startTime);
      },
      resumeDownload(startTime) {
        this.$electron.ipcRenderer.send('resume-downloads-progress', startTime);
      },
      cancelDownload(startTime) {
        this.$electron.ipcRenderer.send('cancel-downloads-progress', startTime);
      },
      closeDownloadBar() {
        if (this.$parent.onCloseDownloadBar) {
          this.$parent.onCloseDownloadBar();
        }
      },
      getFileIcon(savePath, index) {
        if (savePath) {
          imageUtil.getBase64FromFileIcon(savePath, 'normal').then((dataURL) => {
            if (document.getElementById(`icon-${index}`)) {
              document.getElementById(`icon-${index}`).setAttribute('src', dataURL);
            }
          });
        }
      },
    },
  };
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
