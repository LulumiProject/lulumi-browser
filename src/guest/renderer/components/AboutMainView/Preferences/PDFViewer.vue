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

  import { Option, Select } from 'element-ui';

  declare const ipcRenderer: Electron.IpcRenderer;

  @Component({
    components: {
      'el-option': Option,
      'el-select': Select,
    },
  })
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

    setPDFViewer(): void {
      ipcRenderer.send('set-pdf-viewer', {
        pdfViewer: this.pdfViewer,
      });
    }

    mounted() {
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.pdfViewer = ret.pdfViewer;
      });
      ipcRenderer.send('guest-want-data', 'pdfViewer');
    }
    beforeDestroy() {
      ipcRenderer.removeAllListeners('guest-here-your-data');
    }
  };
</script>
