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
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import { Option, Select } from 'element-ui';

interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
}

declare const window: Window;

@Component({
  components: {
    'el-option': Option,
    'el-select': Select,
  },
})
export default class PDFViewer extends Vue {
  options: Array<{ value: string; label: string}> = [
    {
      value: 'pdf-viewer',
      label: 'Chrome pdf extension',
    },
    {
      value: 'PDF.js',
      label: 'PDF Reader in JavaScript',
    },
  ];
  pdfViewer = '';

  setPDFViewer(): void {
    window.ipcRenderer.send('set-pdf-viewer', {
      pdfViewer: this.pdfViewer,
    });
  }

  mounted(): void {
    window.ipcRenderer.on('guest-here-your-data', (event, ret) => {
      this.pdfViewer = ret.pdfViewer;
    });
    window.ipcRenderer.send('guest-want-data', 'pdfViewer');
  }
  beforeDestroy(): void {
    window.ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>
