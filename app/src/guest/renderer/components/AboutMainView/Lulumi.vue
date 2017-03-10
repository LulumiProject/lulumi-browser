<template lang="pug">
  #page-wrapper
    h1#lulumi-name(ref="h1", style="text-align: center;") About Lulumi
    el-table(:data="Array.from(datas.lulumi)", stripe)
      el-table-column(prop="key", label="項目", width="200", align="center")
      el-table-column(prop="value", label="版本", width="180", align="center")
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

<style scoped>
  html {
    background-color: #eee;
  }
</style>
