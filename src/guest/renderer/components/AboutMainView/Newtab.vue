<template lang="pug">
  #page-wrapper
    h1 {{ $t('about.newtabPage.title') }}
</template>

<script>
  export default {
    mounted() {
      /* eslint-disable no-undef */
      ipcRenderer.on('newtab', (event, newtab) => (location.href = newtab));
      ipcRenderer.sendToHost('newtab');
    },
  };
</script>
