<template lang="pug">
  transition(name="download-bar")
    #download-bar
      ul(class="download-list")
        li(v-for="(file, index) in $store.getters.downloads", :key="index", class="download-list__item")
          a(class="download-list__item-name", :href="`${file.url}`")
            i(class="el-icon-document") {{ file.name }}
          el-progress(type="circle", :percentage="file.percentage", :width="30", :stroke-width="3", class="download-list__item-progress")
</template>

<script>
  import { Progress } from 'element-ui';

  import '../../css/el-progress';

  export default {
    components: {
      'el-progress': Progress,
    },
  };
</script>

<style scoped>
  #download-bar {
    background: #F3F3F3;
    border-color: #d3d3d3;
    border-style: solid;
    border-width: 1px 1px 0 0;
    border-top-right-radius: 4px;
    bottom: 0;
    color: #555555;
    font-size: 18px;
    left: 0;
    width: 100vw;
    overflow-x: hidden;
    padding: 0.2em 0.5em;
    position: relative;
  }
  .download-bar-enter-active, .download-bar-leave-active {
    transition: opacity .5s;
  }
  .download-bar-enter, .download-bar-leave-active {
    opacity: 0
  }

  .download-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
  }
  .download-list__item {
    overflow: hidden;
    background-color: #fff;
    border: 1px solid #c0ccda;
    border-radius: 6px;
    box-sizing: border-box;
    margin: 0 2px;
    padding: 5px 0;
    width: 200px;
    display: flex;
    align-items: center;
    justify-content: space-around;;
  }
  .download-list__item-name {
    color: #48576a;
    padding-left: 4px;
    transition: color .3s;
    width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .download-list__item-progress {
    right: 0;
  }
</style>
