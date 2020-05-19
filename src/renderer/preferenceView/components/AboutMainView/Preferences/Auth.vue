<template lang="pug">
div
  h1 {{ $t('about.preferencesPage.authPage.title') }}
  div
    el-input(
      placeholder="Username",
      @change="setAuth",
      v-model.trim="username",
      :autofocus="true",
      ref="input")
      template(slot="prepend") {{ $t('about.preferencesPage.authPage.username') }}
  div(style="margin-top: 15px;")
    el-input(
      placeholder="Password",
      @change="setAuth",
      v-model.trim="password",
      :autofocus="true",
      ref="input")
      template(slot="prepend") {{ $t('about.preferencesPage.authPage.password') }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Input } from 'element-ui';

declare const ipcRenderer: Electron.IpcRenderer;

@Component({
  components: {
    'el-input': Input,
  },
})
export default class TabConfig extends Vue {
  username = '';
  password = '';

  setAuth(): void {
    ipcRenderer.send('set-auth', {
      username: this.username,
      password: this.password,
    });
  }

  mounted() {
    ipcRenderer.on(
      'guest-here-your-data', (event: Electron.Event, auth: any) => {
        this.username = auth.username;
        this.password = auth.password;
      }
    );
    ipcRenderer.send('guest-want-data', 'auth');
  }
  beforeDestroy() {
    ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>
