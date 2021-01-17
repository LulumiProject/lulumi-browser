<template lang="pug">
.tabs-container(@dblclick="onDoubleClick")
  .tabs
    ul(v-sortable="")
      li.tab(v-for="(tab, index) in tabs",
             @dblclick.stop="",
             @click.stop="$parent.onTabClick(index)",
             @click.middle="$parent.onTabClose(index)",
             @contextmenu.prevent="$parent.onTabContextMenu($event, index)",
             :class="index == currentTabIndex ? 'active' : ''",
             :id="`${index}`",
             :ref="`tab-${index}`",
             :data-id="index",
             :key="`tab-${tab.id}`")
        .tab-favicon
          svg(v-if="tab.isLoading",
              viewBox="25 25 50 50",
              :class="tab.didNavigate ? 'circular' : 'circular-reverse'")
            circle(cx="50",
                   cy="50",
                   r="20",
                   fill="none",
                   stroke-width="5",
                   stroke-miterlimit="10",
                   :class="tab.didNavigate ? 'path' : 'path-reverse'")
          object(v-else, :data="tab.favIconUrl", type='image/png', height='16', width='16')
            i(:class="`el-icon-${$store.getters.tabConfig.lulumiDefault.tabFavicon}`",
              style='font-size: 16px;')
          awesome-icon(v-if="tab.hasMedia && tab.isAudioMuted",
                       @click.native.stop="$parent.onToggleAudio($event, index, !tab.isAudioMuted)",
                       name="volume-off",
                       class="volume volume-off")
          awesome-icon(v-else-if="tab.hasMedia && !tab.isAudioMuted",
                       @click.native.stop="$parent.onToggleAudio($event, index, !tab.isAudioMuted)",
                       name="volume-up",
                       class="volume volume-up")
        el-tooltip(:content="tab.title || $t('tabs.loading')",
                   placement="bottom",
                   :openDelay="1500")
          span(class="tab-content")
            | {{ tab.title || $t('tabs.loading') }}
        .tab-close(@click.stop="$parent.onTabClose(index)")
          svg(viewBox="0 0 24 24")
            path(:d="path")
      li.tabs-add(@click="$parent.onNewTab(windowId, 'about:newtab', false)")
  .custom-buttons(v-if="enableCustomButtons")
    svg(@click="onCustomButtonClick")
      use(:xlink:href="loadButton('minimize-window')")
    svg(@click="onCustomButtonClick")
      use(:xlink:href="windowState")
    svg.close(@click="onCustomButtonClick")
      use(:xlink:href="loadButton('close-window')")
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import * as path from 'path';

import AwesomeIcon from 'vue-awesome/components/Icon.vue';
import 'vue-awesome/icons/volume-up';
import 'vue-awesome/icons/volume-off';

import { fixPathForAsarUnpack, is } from 'electron-util';
import Sortable from 'sortablejs';

import { Button, Tooltip } from 'element-ui';

declare const __static: string;

@Component({
  directives: {
    sortable: {
      bind(el, binding, vnode) {
        // eslint-disable-next-line no-use-before-define
        (vnode.context as Tabs).sortable =
          Sortable.create(el, {
            animation: 150,
            swapThreshold: 0.5,
            draggable: '.tab',
            filter: '.tab-close',
            onUpdate() {
              if (vnode.context !== undefined) {
                vnode.context.$store.dispatch('setTabsOrder', {
                  // eslint-disable-next-line no-use-before-define
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
  },
})
export default class Tabs extends Vue {
  sortable: any;

  windowId: number;
  enableCustomButtons = !is.macos;

  get window(): Lulumi.Store.LulumiBrowserWindowProperty {
    return this.$store.getters.windows.find(window => window.id === this.windowId);
  }
  get currentTabIndex(): number {
    return this.$store.getters.currentTabIndexes[this.windowId];
  }
  get tabs(): Lulumi.Store.TabObject[] {
    return this.$store.getters.tabs.filter(tab => tab.windowId === this.windowId);
  }
  get path(): string {
    // eslint-disable-next-line max-len
    return 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';
  }
  get windowState(): string {
    if (this.window && this.window.state === 'maximized') {
      return this.loadButton('restore-window');
    }

    return this.loadButton('maximize-window');
  }

  loadButton(id: string): string {
    return process.env.NODE_ENV !== 'production'
      ? `${path.join('static', 'icons', 'icons.svg')}#${id}`
      : fixPathForAsarUnpack(`${path.join(__static, 'icons', 'icons.svg')}#${id}`);
  }
  onCustomButtonClick(event: Event): void {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      this.$nextTick(() => {
        let pattern: string | null = '';
        if ((event.target as SVGElement).tagName === 'svg') {
          pattern = (event.target as SVGElement).firstElementChild!.getAttribute('xlink:href');
        } else if ((event.target as HTMLElement).tagName === 'use') {
          pattern = (event.target as HTMLElement).getAttribute('xlink:href');
        }
        if (pattern) {
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
        }
      });
    }
  }
  onDoubleClick(event: Electron.Event): void {
    if (event.target) {
      const currentWindow: Electron.BrowserWindow | null =
        this.$electron.remote.BrowserWindow.fromId(this.windowId);
      if (currentWindow) {
        if (currentWindow.isMaximized()) {
          currentWindow.unmaximize();
        } else {
          currentWindow.maximize();
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.tabs-container {
  display: flex;
  height: 36px;
  align-items: center;
  background: #dbdbdb;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-app-region: drag;

  .tabs {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;

    * {
      user-select: none;
      -webkit-user-select: none;
      cursor: default;
      font-size: 12px;
      line-height: 16px;
    }

    ul {
      margin: 0;
      flex-grow: 1;
      display: flex;
      padding: 8px 20px 0 12px;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      height: 36px;

      li {
        list-style: none;
        text-align: -webkit-left;
        justify-content: space-between;
        -webkit-app-region: no-drag;

        &.tab {
          flex-basis: 220px;
          display: flex;
          // https://bit.ly/3e22atx
          min-width: 0;
          position: relative;
          background-color: #dbdbdb;
          z-index: 5;
          height: 31px;
          border-top: 1px solid #bbb;
          margin: 0 5px;
          font-size: 0;

          .tab-favicon {
            z-index: 100;
            align-self: center;
            width: auto;
            height: 16px;
            margin-left: 4px;
            margin-right: 4px;
            user-select: none;

            .volume {
              align-self: center;
              width: 14px;
              height: 14px;
              margin: 0 3px;
            }

            svg {
              &.circular {
                -webkit-animation: rotate 2s linear infinite;
                animation: rotate 2s linear infinite;
                -webkit-transform-origin: center center;
                transform-origin: center center;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                width: 16px;
                height: 16px;
                position: relative;
                margin: 0 auto;
              }
              &.circular-reverse {
                -webkit-animation: rotate 2s linear infinite reverse;
                animation: rotate 2s linear infinite reverse;
                -webkit-transform-origin: center center;
                transform-origin: center center;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                width: 16px;
                height: 16px;
                position: relative;
                margin: 0 auto;
              }

              circle {
                &.path {
                  stroke-dasharray: 1,200;
                  stroke-dashoffset: 0;
                  -webkit-animation: dash 1.5s ease-in-out infinite,color 6s ease-in-out infinite;
                  animation: dash 1.5s ease-in-out infinite,color 6s ease-in-out infinite;
                  stroke-linecap: round;
                }
                &.path-reverse {
                  stroke-dasharray: 1,200;
                  stroke-dashoffset: 0;
                  -webkit-animation:
                    dash 1.5s ease-in-out infinite reverse, color 6s ease-in-out infinite reverse;
                  animation:
                    dash 1.5s ease-in-out infinite reverse, color 6s ease-in-out infinite reverse;
                  stroke-linecap: round;
                }
              }
            }
          }
          .tab-content {
            z-index: 100;
            position: absolute;
            left: 40px;
            right: 16px;
            font-size: 12.6px;
            line-height: 32px;
            cursor: default;
            max-width: 160px;
            user-select: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: clip;

            &:focus {
              outline: none;
            }
          }
          .tab-close {
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 100;
            align-self: center;
            margin-left: 2px;
            margin-right: 2px;
            border-radius: 50%;

            svg {
              width: 12px;
              height: 12px;

              path {
                fill: #555;
              }
            }

            &:hover {
              fill: #fff;
              background: #e25c4d;

              svg path {
                fill: #fff;
              }
            }
          }

          &.active {
            z-index: 10;
            background: #f2f2f2;
            height: 32px;
            border-bottom: 1px solid #f2f2f2;

            &::before,
            &::after {
              z-index: 10;
              align-self: flex-start;
              height: 32px;
              background: #f2f2f2;
              border-bottom: 1px solid #f2f2f2;
            }
          }

          &:hover {
            transition: background-color 0.5s;
            background: #eee;

            &::before,
            &::after {
              transition: background-color 0.5s;
              background: #eee;
            }
          }

          &::before {
            content: '';
            position: absolute;
            z-index: 0;
            left: 0;
            width: 16px;
            height: 32px;
            background-color: #dbdbdb;
            border-left: 1px solid #bbb;
            border-bottom: 1px solid #bbb;
            transform: skewx(-25deg);
            transform-origin: left top;
          }
          &::after {
            content: '';
            position: absolute;
            z-index: 1;
            right: 0;
            width: 16px;
            height: 32px;
            background-color: #dbdbdb;
            border-right: 1px solid #bbb;
            border-bottom: 1px solid #bbb;
            transform: skewx(25deg);
            transform-origin: right top;
          }
        }

        &.tabs-add {
          flex-shrink: 0;
          background: #d9d9d9;
          width: 26px;
          height: 15px;
          border-radius: 2px;
          margin-left: 8px;
          border: 1px solid #bbb;
          align-self: center;
          transform: skewx(25deg);

          &:hover {
            background: #e4e4e4;
          }
          &:active {
            background: #ccc;
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

@keyframes dash {
  0% {
    stroke-dasharray: 1,200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89,200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 89,200;
    stroke-dashoffset: -124;
  }
}

@keyframes color {
  0%, 100% {
    stroke: #d62d20;
  }
  40% {
    stroke: #0057e7;
  }
  66% {
    stroke: #008744;
  }
  80%, 90% {
    stroke: #ffa700;
  }
}
</style>
