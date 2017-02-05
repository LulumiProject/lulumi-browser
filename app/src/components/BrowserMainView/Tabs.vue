<style scoped>
  #browser-tabs {
    display: flex;
    background: linear-gradient(to bottom, #ddd 90%, #bbb);
    font-size: 13px;
    height: 27px;
    -webkit-app-region: drag;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  }
  #browser-tabs > div {
    -webkit-app-region: no-drag;
    flex: 1;
    display: flex;
    background: linear-gradient(to bottom, #ddd 90%, #bbb);
    color: #777;
    border-top: 1px solid #ccc;
    border-right: 1px solid #ccc;
    cursor: default;
    white-space: nowrap;
    overflow:hidden;
  }
  #browser-tabs > div.active {
    -webkit-app-region: drag;
    background: linear-gradient(to bottom, #e5e5e5 90%, #ddd);
    color: #555;
  }
  #browser-tabs > div > span {
    flex: 1;
    padding: 6px 0 4px 12px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  #browser-tabs > div > span > svg {
    margin-left: 5px;
  }
  #browser-tabs > div > a {
    -webkit-app-region: no-drag;
    display: inline-block;
    padding: 5px 10px;
    cursor: pointer;
    float: right;
  }
  #browser-tabs > div > a:hover {
    background: rgb(245, 119, 119);
    color: #fff;
  }
  #browser-tabs > a {
    -webkit-app-region: no-drag;
    display: inline-block;
    color: #888;
    font-size: 11px;
    cursor: pointer;
    margin: 6px 4px;
  }
  #browser-tabs > a.newtab {
    padding: 8px 12px 5px 10px;
    margin: 0;
  }
  #browser-tabs > a.newtab:hover {
    color: #fff;
    background: rgb(99, 190, 229);
  }
  #browser-tabs > a.maximize {
    color: rgb(32, 205, 20);
    text-shadow: 0 0 1px rgba(8, 77, 3, 1);
  }
  #browser-tabs > a.maximize svg {
    font-size: 12.5px
  }
  #browser-tabs > a.minimize {
    color: rgb(255, 213, 0);
    text-shadow: 0 0 1px rgba(65, 42, 2, 1);
  }
  #browser-tabs > a.minimize svg {
    font-size: 12.5px
  }
  #browser-tabs > a.close {
    color: red;
    text-shadow: 0 0 1px rgba(50, 1, 1, 1);
    margin-left: 8px;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity .5s
  }
  .fade-enter, .fade-leave-active {
    opacity: 0
  }
</style>

<template lang="pug">
  #browser-tabs(@dblclick="maximize")
    div(v-for="(page, i) in pages", :class="i == currentPageIndex ? 'active' : ''")
      span(:id="`${i}`", @click="$parent.onTabClick($event, $event.target.id)")
        <transition name="fade">
          icon(name="spinner", v-show="page.isLoading")
        </transition>
        | {{ page.title || 'loading' }}
      a.close(@click.self="$parent.onTabClose($event, $event.target.previousSibling.id)")
        icon(name="times")
    a.newtab(@click="$parent.onNewTab()")
</template>

<script>
  import Icon from 'vue-awesome/components/Icon';
  import 'vue-awesome/icons/times';
  import 'vue-awesome/icons/spinner';

  export default {
    props: [
      'pages',
      'currentPageIndex',
    ],
    components: {
      Icon,
    },
    methods: {
      maximize() {
        this.$electron.remote.getCurrentWindow().maximize();
      },
    },
  };
</script>
