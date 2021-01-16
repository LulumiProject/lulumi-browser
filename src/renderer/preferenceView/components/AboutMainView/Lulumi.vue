<template lang="pug">
#page-wrapper
  h1#lulumi-name(ref="h1", style="text-align: center;") {{ $t('about.lulumiPage.title') }}
  el-table(:data="Array.from(lulumi)", stripe)
    el-table-column(prop="key", :label="$t('about.lulumiPage.item')", width="200", align="center")
    el-table-column(:label="$t('about.lulumiPage.value')", width="180", align="center")
      template(slot-scope="scope", v-if="scope.row !== undefined")
        a.cell(v-if="scope.row.key === 'rev'",
               :href="`https://github.com/LulumiProject/lulumi-browser/commit/${scope.row.value}`")
          | {{ scope.row.value.substring(0, 7) }}
        .cell(v-else-if="scope.row.key === 'userData'",
              style="color: cornflowerblue; cursor: pointer;",
              @click="openPath(scope.row.value)") {{ scope.row.value }}
        .cell(v-else) {{ scope.row.value }}
</template>

<script lang="ts">
/* global Electron */

import { Component, Vue } from 'vue-property-decorator';

import { Table, TableColumn } from 'element-ui';

// eslint-disable-next-line no-use-before-define
interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
}

declare const window: Window;

@Component({
  components: {
    'el-table': Table,
    'el-table-column': TableColumn,
  },
})
export default class Lulumi extends Vue {
  get lulumi(): any {
    return this.$store.getters.about.lulumi;
  }

  openPath(userData: string): void {
    window.ipcRenderer.send('open-path', userData);
  }
}
</script>
