<template lang="pug">
  #page-wrapper
    h1#lulumi-name(ref="h1", style="text-align: center;") About Lulumi
    el-table(:data="Array.from(datas.lulumi)", stripe)
      el-table-column(prop="key", label="item", width="200", align="center")
      el-table-column(label="version", width="180", align="center")
        template(scope="scope")
          a.cell(v-if="scope.row.key === 'rev'", :href="`https://github.com/qazbnm456/lulumi-browser/commit/${scope.row.value}`") {{ scope.row.value.substring(0, 7) }}
          .cell(v-else) {{ scope.row.value }}
</template>

<script>
  export default {
    data() {
      return {
        datas: this.$store.getters.about,
      };
    },
  };
</script>
