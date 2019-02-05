<template lang="pug">
#chrome-tabs-shell(@dblclick.self="onDoubleClick")
  .chrome-tabs(v-sortable="")
    div(v-for="(tab, index) in tabs", @click="$parent.onTabClick(index)", @contextmenu.prevent="$parent.onTabContextMenu($event, index)", :class="index == currentTabIndex ? 'chrome-tab chrome-tab-draggable chrome-tab-current' : 'chrome-tab chrome-tab-draggable'", :id="`${index}`", :ref="`tab-${index}`", :data-id="index", :key="`tab-${tab.id}`")
      svg.left-edge(width="15", height="30")
        path.edge-bg(d="m15,32l0,-32l-2,3l-15,32l10,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
        path.edge-border(d="m0.5,31l14,-32l3,0", stroke-linejoin="round", stroke-dasharray="null", stroke-width="null", fill="none")
      .chrome-tab-bg
        .chrome-tab-favicon
          iview-icon.spin(v-if="tab.isLoading", type="ios-loading", size="16")
          img(:src="tab.favIconUrl", @error="loadDefaultFavicon($event)", height='16', width='16', v-else)
          awesome-icon(@click.native.stop="$parent.onToggleAudio($event, index, !tab.isAudioMuted)", name="volume-off", v-if="tab.hasMedia && tab.isAudioMuted", class="volume volume-off")
          awesome-icon(@click.native.stop="$parent.onToggleAudio($event, index, !tab.isAudioMuted)", name="volume-up", v-else-if="tab.hasMedia && !tab.isAudioMuted", class="volume volume-up")
        el-tooltip(:content="tab.title || $t('tabs.loading')", placement="bottom", :openDelay="1500")
          span(class="chrome-tab-title")
            | {{ tab.title || $t('tabs.loading') }}
      a.close(@click.stop="$parent.onTabClose(index)", class="chrome-tab-close")
      svg.right-edge(width="15", height="30")
        path.edge-bg(d="m15,32l0,-32l-2,3l-15,34l10,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
        path.edge-border(d="m0.5,30l14,-30l4,0", stroke-linejoin="round", stroke-dasharray="null", stroke-width="null", fill="none")
    div(class="chrome-tab chrome-tab-add-btn", @click="$parent.onNewTab(windowId, 'about:newtab', false)")
      svg.left-edge(width="15", height="30")
        path.edge-bg(d="m14,32l0,-32l-2,3l-15,32l10,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
      .chrome-tab-bg(style="width: 10px;padding: 1px 0 0 7px;")
      .chrome-tab-favicon
        i.el-icon-plus
      svg(width="15", height="30", class="right-edge")
        path.edge-bg(d="m14,32l0,-32l-2,3l-15,32l10,0z", stroke-linecap="null", stroke-linejoin="null", stroke-dasharray="null", stroke-width="0")
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

import * as path from 'path';

import AwesomeIcon from 'vue-awesome/components/Icon.vue';
import 'vue-awesome/icons/volume-up';
import 'vue-awesome/icons/volume-off';

import { fixPathForAsarUnpack, is } from 'electron-util';
import Sortable from 'sortablejs';

import { Button, Tooltip } from 'element-ui';
import IViewIcon from 'iview/src/components/icon';

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
  props: {
    windowId: {
      type: Number,
      required: true,
    },
  },
  components: {
    'awesome-icon': AwesomeIcon,
    'el-button': Button,
    'el-tooltip': Tooltip,
    'iview-icon': IViewIcon,
  },
})
export default class Tabs extends Vue {
  sortable: any;

  windowId: number;
  enableCustomButtons: boolean = !is.macos;

  get window(): Lulumi.Store.LulumiBrowserWindowProperty {
    return this.$store.getters.windows.find(window => window.id === this.windowId);
  }
  get currentTabIndex(): number {
    return this.$store.getters.currentTabIndexes[this.windowId];
  }
  get tabs(): Lulumi.Store.TabObject[] {
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
    const currentWindow: Electron.BrowserWindow | null
      = this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      this.$nextTick(() => {
        let pattern: string = '';
        if (event.target.tagName === 'svg') {
          pattern = event.target.firstElementChild.getAttribute('xlink:href');
        } else if (event.target.tagName === 'use') {
          pattern = event.target.getAttribute('xlink:href');
        }
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
  }
  onDoubleClick(event: Electron.Event) {
    if (event.target) {
      const currentWindow: Electron.BrowserWindow | null
        = this.$electron.remote.BrowserWindow.fromId(this.windowId);
      if (currentWindow) {
        if (currentWindow.isMaximized()) {
          currentWindow.unmaximize();
        } else {
          currentWindow.maximize();
        }
      }
    }
  }
  onMouseMove(event: MouseEvent) {
    const x = event.pageX - (event.target as HTMLDivElement).offsetLeft;
    const y = event.pageY - (event.target as HTMLDivElement).offsetTop;
    const xy = `${x} ${y}`;

    const bgWebKit
      = `-webkit-gradient(
        radial,
        ${xy},
        0,
        ${xy},
        100,
        from(rgba(255,255,255,0.8)),
        to(rgba(255,255,255,0.0))),
        linear-gradient(to bottom, #ddd 90%, #f5f5f5)`;

    const target = (event.target as HTMLDivElement).parentNode!.parentNode as HTMLDivElement;
    if (!target.classList.contains('chrome-tab-current')) {
      (target.querySelector('.left-edge') as HTMLElement).style.background = bgWebKit;
      (target.querySelector('.chrome-tab-bg') as HTMLElement).style.background = bgWebKit;
      (target.querySelector('.right-edge') as HTMLElement).style.background = bgWebKit;
    }
  }
  onMouseLeave(event: MouseEvent) {
    const target = (event.target as Element).parentNode!.parentNode as HTMLDivElement;
    if (!target.classList.contains('chrome-tab-current')) {
      (target.querySelector('.left-edge') as HTMLElement).style.background = '';
      (target.querySelector('.chrome-tab-bg') as HTMLElement).style.background = '';
      (target.querySelector('.right-edge') as HTMLElement).style.background = '';
    }
  }
}
</script>

<style lang="less" scoped>
#chrome-tabs-shell {
  display: flex;
  height: 31px;
  padding-left: 10px;
  border-bottom: 1px solid #999;
  user-select: none;
  -webkit-user-select: none;
  -webkit-app-region: drag;

  .chrome-tabs {
    flex: 1;
    display: flex;

    * {
      user-select: none;
      -webkit-user-select: none;
      cursor: default;
      font-size: 12px;
      line-height: 16px;
    }

    .chrome-tab {
      border: 0 !important;
      position: relative;
      margin: 0 -5px;
      height: 30px;
      z-index: 1;
      transition: .1s transform;
      border-bottom: 1px solid #999;
      text-align: start;
      -webkit-app-region: no-drag;

      &:not(:last-child) {
        flex: 1;
      }
      &.ghost {
        opacity: .5;
      }

      // tab decoration
      svg {
        position: absolute;

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
        left: 5px;

        img {
          width: 16px;
          height: 16px;
          padding-right: 1px;
        }

        .spin {
          color: #2d8cf0;
          animation: ani-spin 1s linear infinite;
        }

        @keyframes ani-spin {
          from { transform: rotate(0deg); }
          50%  { transform: rotate(180deg); }
          to   { transform: rotate(360deg); }
        }

        svg.volume {
          position: relative;
          flex: 1;
          width: 16px;
          height: 16px;
          padding: 0 2px;
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
        padding: 15px 0 0 10px;
        height: 28px;
        overflow: hidden;
        white-space: nowrap;
      }

      span.focusing {
        outline: 0;
      }

      &.chrome-tab-nofavicon .chrome-tab-title {
        padding-left: 15px;
      }

      .chrome-tab-close {
        display: none;
        position: absolute;
        right: 18px;
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
          color: #f1f1f1;
        }
        &:hover,
        &:active {
          background: #f17469;
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

        .chrome-tab-favicon {
          left: 10px;
        }

        svg {
          height: 32px;

          .edge-bg {
            fill: #f1f1f1;
          }
        }

        .chrome-tab-bg {
          padding-top: 2px;
          background: #f1f1f1;

          .chrome-tab-title {
            padding: 13px 0 0 15px;
          }
        }

        .chrome-tab-close {
          top: 10px;
        }
      }

      &.chrome-tab-add-btn {
        width: 45px;
        margin-right: 20px;
        opacity: .7;
        z-index: 0;

        svg, .chrome-tab-bg {
          visibility: hidden;
          border: 0;
        }

        .chrome-tab-favicon {
          top: 16px;
          width: 35px;
          height: 0px;
          justify-content: center;
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
}

.custom-buttons {
  display: flex;
  width: 120px;
  padding-left: 30px;
  align-items: center;
  justify-content: space-between;

  svg {
    width: 10px;
    height: 10px;
    padding: 11px 15px;
    opacity: 1;
    -webkit-app-region: no-drag;

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
</style>
