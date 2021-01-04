<template lang="pug">
#page-wrapper
  h1#newtab-name {{ $t('about.newtabPage.title') }}
</template>

<script lang="ts">
/* global Electron */

import { Component, Vue } from 'vue-property-decorator';

declare const ipcRenderer: Electron.IpcRenderer;

@Component
export default class Newtab extends Vue {
  beforeMount(): void {
    if (document) {
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
