<template lang="pug">
  div
    h1 {{ $t('about.preferencesPage.pdfViewerPage.title') }}
    el-select(
      :placeholder="pdfViewer",
      v-model.trim="pdfViewer",
      @change="setPDFViewer",)
      el-option(v-for="item in options", :label="item.label", :value="item.value", :key="item.value")
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  declare const ipcRenderer: Electron.IpcRenderer;

  @Component
  export default class PDFViewer extends Vue {
    options: Array<object> = [
      {
        value: 'pdf-viewer',
        label: 'Chrome pdf extension',
      },
      {
        value: 'PDF.js',
        label: 'PDF Reader in JavaScript',
      },
    ];
    pdfViewer: string = '';

    setPDFViewer() {
      ipcRenderer.send('set-pdf-viewer', {
        pdfViewer: this.pdfViewer,
      });
    }

    mounted() {
      ipcRenderer.send('guest-want-data', 'pdfViewer');
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.pdfViewer = ret.pdfViewer;
      });
    }
    beforeDestroy() {
      ipcRenderer.removeAllListeners('guest-here-your-data');
    }
  };
</script>
