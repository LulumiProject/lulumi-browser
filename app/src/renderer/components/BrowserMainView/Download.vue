<template lang="pug">
  transition(name="download-bar")
    #download-bar
      ul(class="download-list")
        el-popover(placement="top-start", width="178", trigger="hover", popper-class="download-list__popper"
          v-for="(file, index) in files", :key="index")
          div {{ file.state }}
          el-button-group(v-show="checkStateForButtonGroup(file.state)")
            el-button(:disabled="file.state !== 'progressing'", v-if="file.isPaused && file.canResume", :plain="true", type="warning", size="mini", icon="caret-right", @click="resumeDownload(file.startTime)")
            el-button(:disabled="file.state !== 'progressing'", v-else, :plain="true", type="warning", size="mini", icon="minus", @click="pauseDownload(file.startTime)")
            el-button(:disabled="file.state !== 'progressing'", :plain="true", type="danger", size="mini", icon="circle-close", @click="cancelDownload(file.startTime)")
            el-button(:disabled="file.state === 'cancelled'", :plain="true", type="info", size="mini", icon="document", @click="showItemInFolder(file.savePath)")
          li(class="download-list__item", slot="reference")
            a(class="download-list__item-name", :href="`${file.url}`")
              i(class="el-icon-document") {{ file.name }}
            el-progress(:status="checkStateForProgress(file.state)", type="circle", :percentage="percentage(file)", :width="30", :stroke-width="3", class="download-list__item-progress")
      span#download-bar-close(class="el-icon-close", @click="closeDownloadBar")
</template>

<script>
  import { Button, ButtonGroup, Progress, Popover } from 'element-ui';

  import '../../css/el-progress';
  import '../../css/el-popover';

  export default {
    components: {
      'el-button-group': ButtonGroup,
      'el-button': Button,
      'el-progress': Progress,
      'el-popover': Popover,
    },
    computed: {
      files() {
        // eslint-disable-next-line arrow-body-style
        return this.$store.getters.downloads.filter((download) => {
          return download.state !== 'hidden';
        });
      },
    },
    methods: {
      percentage(file) {
        return parseInt((file.getReceivedBytes / file.totalBytes) * 100, 10) || 0;
      },
      showItemInFolder(savePath) {
        if (savePath) {
          this.$electron.shell.showItemInFolder(savePath);
        }
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
  .download-list__item-name {
    color: #48576a;
    padding-left: 4px;
    transition: color .3s;
  }
  .download-list__item-name > i {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 160px;
  }
  .download-list__item-progress {
    right: 0;
  }
</style>
