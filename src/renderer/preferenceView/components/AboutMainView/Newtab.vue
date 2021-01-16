<template lang="pug">
#page-wrapper
  h1#newtab-name {{ $t('about.newtabPage.title') }}
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
}

declare const window: Window;

window.ipcRenderer = window.func.ipcRenderer;

@Component
export default class Newtab extends Vue {
  beforeMount(): void {
    if (document) {
      window.ipcRenderer.once('newtab', (event, newtab: string) => {
        if (document.location && newtab !== '') {
          document.location.href = newtab;
        }
      });
      window.ipcRenderer.sendToHost('newtab');
    }
  }
}
</script>
