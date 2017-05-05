<template lang="pug">
  div
    h1 {{ $t('about.preferencesPage.pdfViewerPage.title') }}
    el-select(
      :placeholder="pdfViewer",
      v-model.trim="pdfViewer",
      @change="setPDFViewer",)
      el-option(v-for="item in options", :label="item.label", :value="item.value", :key="item.value")
</template>

<script>
  export default {
    data() {
      return {
        options: [
          {
            value: 'pdf-viewer',
            label: 'Chrome pdf extension',
          },
          {
            value: 'PDF.js',
            label: 'PDF Reader in JavaScript',
          },
        ],
        pdfViewer: '',
      };
    },
    methods: {
      setPDFViewer() {
        // eslint-disable-next-line no-undef
        ipcRenderer.send('set-pdf-viewer', {
          pdfViewer: this.pdfViewer,
        });
      },
    },
    mounted() {
      // eslint-disable-next-line no-undef
      ipcRenderer.send('guest-want-data', 'pdfViewer');
      // eslint-disable-next-line no-undef
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.pdfViewer = ret.pdfViewer;
      });
    },
    beforeDestroy() {
      // eslint-disable-next-line no-undef
      ipcRenderer.removeAllListeners([
        'guest-here-your-data',
      ]);
    },
  };
</script>
