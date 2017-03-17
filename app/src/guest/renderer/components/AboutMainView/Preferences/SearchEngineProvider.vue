<template lang="pug">
  div
    h1 Search Engine Provider Page
    el-table(:data="tableData", :default-sort = "{prop: 'name', order: 'descending'}", :row-class-name="currentSearchEngine", @current-change="handleCurrentChange")
      el-table-column(prop="current", label="Current", width="180", align="center")
      el-table-column(prop="search", label="Search Engine", align="center")
      el-table-column(prop="name", label="Name", width="180", align="center")
</template>

<script>
  export default {
    data() {
      return {
        tableData: [],
      };
    },
    methods: {
      // eslint-disable-next-line consistent-return
      currentSearchEngine(row) {
        if (row.current === 'Y') {
          return 'activated';
        }
      },
      handleCurrentChange(obj) {
        if (obj) {
          // eslint-disable-next-line no-undef
          ipcRenderer.send('set-current-search-engine-provider', {
            search: obj.search,
            name: obj.name,
          });
        }
      },
    },
    mounted() {
      // eslint-disable-next-line no-undef
      ipcRenderer.send('guest-want-data', 'searchEngineProvider');
      // eslint-disable-next-line no-undef
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.tableData = [];
        ret.searchEngine.forEach((val) => {
          this.tableData.push({
            current: ret.currentSearchEngine.search === val.search ? 'Y' : 'N',
            search: val.search,
            name: val.name,
          });
        });
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

<style>
  .el-table .activated {
    background: #e2f0e4;
  }
</style>
