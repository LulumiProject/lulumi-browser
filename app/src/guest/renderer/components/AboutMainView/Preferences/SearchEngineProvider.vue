<template lang="pug">
  div
    h1 Search Engine Provider Page
    el-table(:data="tableData", :default-sort = "{prop: 'name', order: 'descending'}")
      el-table-column(prop="date", label="Default", width="180", align="center")
      el-table-column(prop="name", label="Search Engine", sortable, width="180", align="center")
      el-table-column(prop="address", label="Shortcut", align="center")
</template>

<script>
  export default {
    data() {
      return {
        tableData: [
          {
            date: '2016-05-02',
            name: 'A',
            address: 'test 1',
          },
          {
            date: '2016-05-04',
            name: 'B',
            address: 'test 2',
          },
          {
            date: '2016-05-01',
            name: 'C',
            address: 'test3 ',
          },
          {
            date: '2016-05-03',
            name: 'D',
            address: 'test 4',
          },
        ],
      };
    },
    methods: {
      formatter(row) {
        return row.address;
      },
    },
  };
</script>
