<template lang="pug">
  div
    h1 {{ $t('about.preferencesPage.searchEngineProviderPage.title') }}
    el-table(:data="tableData", :default-sort = "{prop: 'name', order: 'descending'}", :row-class-name="currentSearchEngine", @current-change="handleCurrentChange")
      el-table-column(prop="current", :label="$t('about.preferencesPage.searchEngineProviderPage.current')", width="180", align="center")
      el-table-column(prop="search", :label="$t('about.preferencesPage.searchEngineProviderPage.searchEngine')", align="center")
      el-table-column(prop="name", :label="$t('about.preferencesPage.searchEngineProviderPage.name')", width="180", align="center")
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  interface TableData {
    current: string;
    name: string;
    search: string;
    autocomplete: string;
  }

  declare const ipcRenderer: Electron.IpcRenderer;

  @Component
  export default class SearchEngineProvider extends Vue {
    tableData: Array<TableData> = [];

    currentSearchEngine(row): string {
      if (row.current === 'Y') {
        return 'activated';
      }
      return '';
    }
    handleCurrentChange(obj): void {
      if (obj) {
        ipcRenderer.send('set-current-search-engine-provider', {
          name: obj.name,
          search: obj.search,
          autocomplete: obj.autocomplete,
        });
      }
    }

    mounted() {
      ipcRenderer.send('guest-want-data', 'searchEngineProvider');
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.tableData = [];
        ret.searchEngine.forEach((val) => {
          this.tableData.push({
            current: ret.currentSearchEngine.search === val.search ? 'Y' : 'N',
            name: val.name,
            search: val.search,
            autocomplete: val.autocomplete,
          });
        });
      });
    }
    beforeDestroy() {
      ipcRenderer.removeAllListeners('guest-here-your-data');
    }
  };
</script>

<style>
  .el-table .activated {
    background: #e2f0e4;
  }
</style>
