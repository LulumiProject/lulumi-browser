<template lang="pug">
  #browser-tabs(v-sortable="", @dblclick="$electron.remote.getCurrentWindow().maximize()")
    .window-buttons
    .browser-tab(v-for="(page, i) in pages", :class="i == currentPageIndex ? 'active' : ''", :id="`${i}`", :ref="`tab-${i}`")
      <transition name="fade">
        div#tab-icons(@click="$parent.onToggleAudio($event, i, !page.isAudioMuted)")
          i.el-icon-loading(v-if="page.isLoading")
          img(v-show="page.favicon", :src="page.favicon", height='16', width='16', v-else)
          icon(name="volume-off", v-if="page.hasMedia && page.isAudioMuted")
          icon(name="volume-up", v-else-if="page.hasMedia && !page.isAudioMuted")
      </transition>
      el-tooltip(:content="page.title || 'loading'", placement="bottom", :openDelay="1000")
        span(:id="`span-${i}`", @mousemove.stop="onMouseMove", @mouseleave.stop="onMouseLeave", @click="$parent.onTabClick($event, parseInt(($event.target.id).split('-')[1]), 10)", @contextmenu.prevent="$parent.onTabContextMenu($event, i)")
          | {{ page.title || 'loading' }}
      a.close(@click="onClose")
        icon(name="times")
    el-button(class="newtab", size="small", icon="more", @click="$parent.onNewTab()")
</template>

<script>
  import Icon from 'vue-awesome/components/Icon';
  import 'vue-awesome/icons/times';
  import 'vue-awesome/icons/volume-up';
  import 'vue-awesome/icons/volume-off';

  import Sortable from 'sortablejs';

  import { Button, Tooltip } from 'element-ui';

  export default {
    directives: {
      sortable: {
        update(el) {
          Sortable.create(el, {
            draggable: '.browser-tab',
            animation: 150,
            ghostClass: 'ghost',
            onUpdate(event) {
              const item = event.item;
              if (!item.dataset.oldIndex) {
                item.dataset.oldIndex = event.oldIndex;
              }
              item.dataset.newIndex = event.newIndex;
            },
          });
        },
      },
    },
    components: {
      Icon,
      'el-button': Button,
      'el-tooltip': Tooltip,
    },
    computed: {
      pages() {
        return this.$store.getters.pages;
      },
      currentPageIndex() {
        return this.$store.getters.currentPageIndex;
      },
    },
    methods: {
      onClose(event) {
        let id = null;
        try {
          id = parseInt((event.target.previousSibling.id).split('-')[1], 10);
        } catch (e) {
          try {
            id = parseInt((event.target.parentNode.previousSibling.id).split('-')[1], 10);
          } catch (e) {
            id = parseInt((event.target.parentNode.parentNode.previousSibling.id).split('-')[1], 10);
          }
        }
        this.$parent.onTabClose(event, id);
      },
      onMouseMove(event) {
        const x = event.pageX - event.target.offsetLeft;
        const y = event.pageY - event.target.offsetTop;
        const xy = `${x} ${y}`;

        // eslint-disable-next-line max-len
        const bgWebKit = `-webkit-gradient(radial, ${xy}, 0, ${xy}, 100, from(rgba(255,255,255,0.8)), to(rgba(255,255,255,0.0))), linear-gradient(to bottom, #e5e5e5 90%, #ddd)`;

        event.target.parentNode.style.background = bgWebKit;
      },
      onMouseLeave(event) {
        event.target.parentNode.style.background = '';
      },
    },
    mounted() {
      const ipc = this.$electron.ipcRenderer;
      ipc.on('reload', () => {
        if (this.$parent.onClickRefresh) {
          this.$parent.onClickRefresh();
        }
      });
    },
  };
</script>

<style scoped>
  #browser-tabs {
    display: flex;
    background: linear-gradient(to bottom, #ddd 90%, #bbb);
    font-size: 15px;
    height: 38px;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  }
  #browser-tabs > div.window-buttons {
    -webkit-app-region: drag;
    padding-right: 80px;
  }
  #browser-tabs > div.browser-tab {
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
    background: linear-gradient(to bottom, #e5e5e5 90%, #ddd);
    color: #555;
  }
  #browser-tabs > div.ghost {
    opacity: .5;
    color: red;
  }
  #browser-tabs > div > span.el-tooltip {
    flex: 1;
    padding: 6px 0 4px 12px;
    line-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .browser-tab {
    align-items: center;
  }
  #tab-icons {
    margin-top: 3px;
  }
  #tab-icons > div, #tab-icons > img {
    margin-left: 10px;
  }
  #tab-icons > i, #tab-icons > svg {
    width: 20px;
    margin-left: 10px;
  }
  #browser-tabs > div > a {
    -webkit-app-region: no-drag;
    display: inline-block;
    padding: 5px 10px;
    margin-right: 5px;
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
  #browser-tabs > button.newtab {
    border-style: outset;
    margin: 8px 10px 2px 3px;
    height: 24px;
    line-height: 22px;
    padding-top: 0;
    padding-bottom: 0;
    background: linear-gradient(to bottom, #e5e5e5 90%, #ddd);
  }
  #browser-tabs > button.newtab:hover {
    border-style: inset;
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
