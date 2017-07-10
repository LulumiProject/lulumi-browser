<template lang="pug">
  #page-wrapper
    h1#lulumi-name(ref="h1", style="text-align: center;") {{ $t('about.lulumiPage.title') }}
    el-table(:data="Array.from(datas.lulumi)", stripe)
      el-table-column(prop="key", :label="$t('about.lulumiPage.item')", width="200", align="center")
      el-table-column(:label="$t('about.lulumiPage.value')", width="180", align="center")
        template(scope="scope")
          a.cell(v-if="scope.row.key === 'rev'", :href="`https://github.com/qazbnm456/lulumi-browser/commit/${scope.row.value}`") {{ scope.row.value.substring(0, 7) }}
          .cell(v-else-if="scope.row.key === 'userData'", style="color: cornflowerblue; cursor: pointer;", @click="showItemInFolder(scope.row.value)") {{ scope.row.value }}
          .cell(v-else) {{ scope.row.value }}
</template>

<script>
  export default {
    data() {
      return {
        datas: this.$store.getters.about,
      };
    },
    methods: {
      showItemInFolder(userData) {
        // eslint-disable-next-line no-undef
        ipcRenderer.send('show-item-in-folder', userData);
      },
    },
  };
</script>
