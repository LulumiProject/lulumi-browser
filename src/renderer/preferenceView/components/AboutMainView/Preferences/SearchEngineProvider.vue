<template lang="pug">
div
  el-row
    h1 {{ $t('about.preferencesPage.searchEngineProviderPage.title') }}
    el-table(ref="table",
             :data="tableData",
             highlight-current-row,
             :default-sort = "{prop: 'name', order: 'descending'}",
             @row-click="handleRowClick")
      el-table-column(prop="current",
                      :label="$t('about.preferencesPage.searchEngineProviderPage.current')",
                      width="180",
                      align="center")
      el-table-column(prop="search",
                      :label="$t('about.preferencesPage.searchEngineProviderPage.searchEngine')",
                      align="center")
      el-table-column(prop="name",
                      :label="$t('about.preferencesPage.searchEngineProviderPage.name')",
                      width="180",
                      align="center")
  el-row(type="flex", justify="start")
    h3 {{ $t('about.preferencesPage.searchEngineProviderPage.options') }}
  el-row(type="flex", justify="start")
    el-col(:span="2")
      el-switch(@change="toggleAutoFetch",
                v-model="autoFetch",
                active-color="#13ce66",
                inactive-color="#ff4949")
    el-col(style="text-align: start;")
      | {{ $t('about.preferencesPage.searchEngineProviderPage.autoFetch') }}
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import { Col, Row, Switch, Table, TableColumn } from 'element-ui';

interface TableData {
  current: string;
  name: string;
  search: string;
  autocomplete: string;
}

interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
}

declare const window: Window;

@Component({
  components: {
    'el-col': Col,
    'el-row': Row,
    'el-switch': Switch,
    'el-table': Table,
    'el-table-column': TableColumn,
  },
})
export default class SearchEngineProvider extends Vue {
  tableData: TableData[] = [];
  autoFetch = false;

  handleRowClick(row: TableData): void {
    if (row) {
      window.ipcRenderer.send('set-current-search-engine-provider', {
        currentSearchEngine: {
          name: row.name,
          search: row.search,
          autocomplete: row.autocomplete,
        },
        autoFetch: this.autoFetch,
      });
    }
  }
  toggleAutoFetch(val: boolean): void {
    window.ipcRenderer.send('set-current-search-engine-provider', {
      currentSearchEngine: null,
      autoFetch: val,
    });
  }

  mounted(): void {
    window.ipcRenderer.on('guest-here-your-data', (event, ret) => {
      this.autoFetch = ret.autoFetch;
      this.tableData.length = 0;
      ret.searchEngine.forEach((val, index) => {
        Vue.set(this.tableData, index, {
          current: ret.currentSearchEngine.search === val.search ? 'Y' : 'N',
          name: val.name,
          search: val.search,
          autocomplete: val.autocomplete,
        });
      });
      this.$nextTick(() => {
        this.tableData.forEach((data, index) => {
          if (data.current === 'Y') {
            (this.$refs.table as any).setCurrentRow(this.tableData[index]);
          }
        });
      });
    });
    window.ipcRenderer.send('guest-want-data', 'searchEngineProvider');
  }
  beforeDestroy(): void {
    window.ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>

<style lang="less">
.el-table__body {
  cursor: pointer;

  tr.current-row > td {
    background-color: #f0f9eb;
  }
}
</style>
