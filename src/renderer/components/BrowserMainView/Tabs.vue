<template lang="pug">
  #chrome-tabs-shell(@dblclick.self="onDoubleClick")
    .chrome-tabs(v-sortable="")
      div(v-for="(tab, index) in tabs", @click="$parent.onTabClick(index)", @contextmenu.prevent="$parent.onTabContextMenu($event, index)", :class="index == currentTabIndex ? 'chrome-tab chrome-tab-draggable chrome-tab-current' : 'chrome-tab chrome-tab-draggable'", :id="`${index}`", :ref="`tab-${index}`", :data-id="index", :key="`tab-${tab.id}`")
        svg(width="15", height="30", class="left-edge")
          path(class="edge-bg", d="m14,29l0,-28l-2,0.1l-11.45,27.9l13.2,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
          path(class="edge-border", d="m1,28.5l11.1,-28l1.9,0", stroke-linejoin="round", stroke-dasharray="null", stroke-width="null", fill="none")
        .chrome-tab-bg
          div#tab-icons(class="chrome-tab-favicon")
            i.el-icon-loading(v-if="tab.isLoading", style="font-size: 16px; padding-right: 2px;")
            img(:src="tab.favIconUrl", @error="loadDefaultFavicon($event)", height='16', width='16', v-else)
            awesome-icon(@click.native.stop="$parent.onToggleAudio($event, index, !tab.isAudioMuted)", name="volume-off", v-if="tab.hasMedia && tab.isAudioMuted", class="volume volume-off")
            awesome-icon(@click.native.stop="$parent.onToggleAudio($event, index, !tab.isAudioMuted)", name="volume-up", v-else-if="tab.hasMedia && !tab.isAudioMuted", class="volume volume-up")
          el-tooltip(:content="tab.title || $t('tabs.loading')", placement="bottom", :openDelay="1500")
            span(class="chrome-tab-title")
              | {{ tab.title || $t('tabs.loading') }}
        a.close(@click.stop="$parent.onTabClose(index)", class="chrome-tab-close")
        svg(width="15", height="30", class="right-edge")
          path(class="edge-bg", d="m14,29l0,-28l-2,0.1l-11.45,27.9l13.2,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
          path(class="edge-border", d="m1,28.5l11.1,-28l1.9,0", stroke-linejoin="round", stroke-dasharray="null", stroke-width="null", fill="none")
      div(class="chrome-tab chrome-tab-add-btn", @click="$parent.onNewTab(windowId, 'about:newtab', false)")
        svg(width="15", height="30", class="left-edge")
          path(class="edge-bg", d="m14,29l0,-28l-2,0.1l-11.45,27.9l13.2,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
        .chrome-tab-bg(style="padding-right: 10px;")
        .chrome-tab-favicon
          i.el-icon-plus
        svg(width="15", height="30", class="right-edge")
          path(class="edge-bg", d="m14,29l0,-28l-2,0.1l-11.45,27.9l13.2,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
    .custom-buttons(v-if="enableCustomButtons")
      svg(@click="onCustomButtonClick")
        use(:xlink:href="loadButton('minimize-window')")
      svg(@click="onCustomButtonClick")
        use(:xlink:href="window && window.state === 'maximized' ? loadButton('restore-window') : loadButton('maximize-window')")
      svg.close(@click="onCustomButtonClick")
        use(:xlink:href="loadButton('close-window')")
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import path from 'path';

  import AwesomeIcon from 'vue-awesome/components/Icon.vue';
  import 'vue-awesome/icons/volume-up';
  import 'vue-awesome/icons/volume-off';

  import { fixPathForAsarUnpack, is } from 'electron-util';
  import Sortable from 'sortablejs';

  import { Button, Tooltip } from 'element-ui';

  import { store } from 'lulumi';

  declare const __static: string;

  @Component({
    directives: {
      sortable: {
        update(el, binding, vnode) {
          (vnode.context as Tabs).sortable =
            Sortable.create(el, {
              draggable: '.chrome-tab-draggable',
              animation: 150,
              ghostClass: 'ghost',
              onUpdate() {
                if (vnode.context !== undefined) {
                  vnode.context.$store.dispatch('setTabsOrder', {
                    windowId: (vnode.context as Tabs).windowId,
                    tabsOrder: this.toArray(),
                  });
                }
              },
            });
        },
      },
    },
    props: [
      'windowId',
    ],
    components: {
      'awesome-icon': AwesomeIcon,
      'el-button': Button,
      'el-tooltip': Tooltip,
    },
  })
  export default class Tabs extends Vue {
    sortable: any;

    windowId: number;
    enableCustomButtons: boolean = !is.macos;

    get window(): store.LulumiBrowserWindowProperty {
      return this.$store.getters.windows.find(window => window.id === this.windowId);
    }
    get currentTabIndex(): number {
      return this.$store.getters.currentTabIndexes[this.windowId];
    }
    get tabs(): Array<store.TabObject> {
      return this.$store.getters.tabs.filter(tab => tab.windowId === this.windowId);
    }

    loadButton(id: string): string {
      return process.env.NODE_ENV !== 'production'
        ? `${path.join('static', 'icons', 'icons.svg')}#${id}`
        : fixPathForAsarUnpack(`${path.join(__static, 'icons', 'icons.svg')}#${id}`);
    }
    loadDefaultFavicon(event: Electron.Event) {
      (event.target as HTMLImageElement).src = this.$store.getters.tabConfig.defaultFavicon;
    }
    onCustomButtonClick(event) {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
      this.$nextTick(() => {
        const pattern: string = event.target.firstElementChild.getAttribute('xlink:href');
        const state: string = pattern.split('#').reverse()[0].split('-')[0];
        if (state === 'minimize') {
          currentWindow.minimize();
        } else if (state === 'restore') {
          currentWindow.unmaximize();
        } else if (state === 'maximize') {
          currentWindow.maximize();
        } else if (state === 'close') {
          currentWindow.close();
        }
      });
    }
    onDoubleClick(event: Electron.Event) {
      if (event.target) {
        const currentWindow: Electron.BrowserWindow
          = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
        if (currentWindow.isMaximized()) {
          currentWindow.unmaximize();
        } else {
          currentWindow.maximize();
        }
      }
    }
    onMouseMove(event: MouseEvent) {
      const x = event.pageX - (event.target as HTMLElement).offsetLeft;
      const y = event.pageY - (event.target as HTMLElement).offsetTop;
      const xy = `${x} ${y}`;

      const bgWebKit = `-webkit-gradient(radial, ${xy}, 0, ${xy}, 100, from(rgba(255,255,255,0.8)), to(rgba(255,255,255,0.0))), linear-gradient(to bottom, #ddd 90%, #f5f5f5)`;

      const target = (event.target as Element).parentNode!.parentNode as HTMLElement;
      if (!target.classList.contains('chrome-tab-current')) {
        (target.getElementsByClassName('left-edge')[0] as HTMLElement).style.background = bgWebKit;
        (target.getElementsByClassName('chrome-tab-bg')[0] as HTMLElement).style.background = bgWebKit;
        (target.getElementsByClassName('right-edge')[0] as HTMLElement).style.background = bgWebKit;
      }
    }
    onMouseLeave(event: MouseEvent) {
      const target = (event.target as Element).parentNode!.parentNode as HTMLElement;
      if (!target.classList.contains('chrome-tab-current')) {
        (target.getElementsByClassName('left-edge')[0] as HTMLElement).style.background = '';
        (target.getElementsByClassName('chrome-tab-bg')[0] as HTMLElement).style.background = '';
        (target.getElementsByClassName('right-edge')[0] as HTMLElement).style.background = '';
      }
    }
  };
</script>

<style lang="less" scoped>
  #chrome-tabs-shell {
    display: flex;
    height: 38px;
    padding-left: 10px;
    border-bottom: 1px solid #999;
    -webkit-user-select: none;
    -webkit-app-region: drag;
  }

  .chrome-tabs {
    flex: 1;
    display: flex;

    * {
      -webkit-user-select: none;
      cursor: default;
      font-size: 12px;
      line-height: 13px;
    }

    .chrome-tab {
      border: 0 !important;
      position: relative;
      margin: 0 -5px;
      top: 7px;
      height: 30px;
      z-index: 1;
      transition: .1s transform;
      border-bottom: 1px solid #999;
      text-align: start;
      -webkit-app-region: no-drag;

      &:not(:last-child) {
        flex: 1;
      }

      &:last-child {
        width: 45px;
        opacity: .7;
        z-index: 0;
      }

      // tab decoration
      svg {
        position: absolute;
        top: 0;
        height: 29px;

        .edge-bg {
          fill: #ddd;
          transition: .2s fill;
        }
        .edge-border {
          stroke: #808080;
          stroke-width: 1px;
        }

        &.right-edge {
          transform: scaleX(-1);
          right: 0;
        }
      }
      .chrome-tab-bg {
        position: absolute;
        display: flex;
        align-items: center;
        top: 0;
        left: 14px;
        right: 14px;
        height: 29px;
        padding-right: 20px;
        background: #ddd;
        border-top: 1px solid #808080;
        transition: .2s background;
      }

      .chrome-tab-favicon {
        position: relative;
        display: flex;
        align-items: center;
        left: 10px;

        img {
          width: 16px;
          height: 16px;
          padding-right: 2px;
        }

        svg.volume {
          position: relative;
          flex: 1;
          width: 16px;
          height: 16px;
          padding: 0 3px;
        }
      }
      .spinner {
        position: relative;
        left: 1px;
        top: 1px;
      }
      &.chrome-tab-pinned {
        .chrome-tab-favicon {
          left: 20px;
        }
      }

      .chrome-tab-title {
        color: #222222;
        padding: 17px 0 0 16px;
        height: 28px;
        overflow: hidden;
        white-space: nowrap;
      }
      &.chrome-tab-nofavicon .chrome-tab-title {
        padding-left: 16px;
      }

      .chrome-tab-close {
        display: none;
        position: absolute;
        right: 14px;
        top: 8px;
        width: 15px;
        height: 15px;
        border-radius: 8px;

        &:before {
          content: "\00D7";
          position: absolute;
          top: 1px;
          right: 3px;
          font-size: 12px;
          line-height: 12px;
          color: #777777;
        }
        &:hover:before,
        &:active:before {
          color: white;
        }
        &:hover,
        &:active {
          background: #f17469;
        }
        &:active:before {
        }
      }

      &:hover {
        .chrome-tab-bg {
          background: #f0f0f0;
        }
        svg .edge-bg {
          fill: #f0f0f0;
        }
        .chrome-tab-close {
          display: block;
        }
      }

      &.chrome-tab-dragging {
        transition: none !important;
      }

      &.chrome-tab-current {
        border: 0;
        z-index: 2;

        svg {
          .edge-bg {
            fill: #f5f5f5;
          }
        }
        .chrome-tab-bg {
          background: #f5f5f5;
        }
      }

      &.chrome-tab-add-btn {
        svg, .chrome-tab-bg {
          visibility: hidden;
          border: 0;
        }

        .chrome-tab-favicon {
          top: 6px;
          padding: 0 6px;
        }
        .icon {
          font-size: 17px;
          line-height: 15px;
          color: #666;
        }

        &:hover {
          svg, .chrome-tab-bg {
            visibility: visible;
          }
          svg .edge-bg {
            fill: #ccc;
          }
          .chrome-tab-bg {
            background: #ccc;
          }
          .icon {
            color: #444;
          }
        }
      }
    }
  }

  .chrome-tab-draggable {
    cursor: move;
	  cursor: -webkit-grabbing;
  
    &.ghost {
      opacity: .5;
    }
  }

  .custom-buttons {
    display: flex;
    width: 120px;
    height: 20px;
    padding-right: 10px;
    justify-content: space-between;
    -webkit-app-region: no-drag;

    svg {
      width: 30px;
      height: 10px;
      padding: 5px 15px;
      opacity: 1;

      &:hover {
        background: #bbb;
      }
      &.close:hover {
        color: white;
        background: #f52424;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }

  // make room for the traffic lights
  .darwin:not(.fullscreen) .chrome-tabs {
    padding-left: 70px;
  }
</style>
