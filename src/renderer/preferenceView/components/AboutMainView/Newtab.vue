<template lang="pug">
#page-wrapper
  h1#newtab-name {{ $t('about.newtabPage.title') }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

declare const ipcRenderer: Electron.IpcRenderer;

@Component
export default class Newtab extends Vue {
  beforeMount() {
    if (process.env.NODE_ENV !== 'testing') {
      ipcRenderer.once('newtab', (event, newtab: string) => {
        if (document.location && newtab !== '') {
          document.location.href = newtab;
        }
      });
      ipcRenderer.sendToHost('newtab');
    }
  }
}
</script>
