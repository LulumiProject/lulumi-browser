<template lang="pug">
#status-bar
  span.status-item(class="left", @click.self="onClick")
    | [{{ tab.status | capitalize }}]
  span.status-item(class="right", @click.self="onClick")
    awesome-icon(name="spinner")
    | {{ "Loading playbooks..." }}
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import AwesomeIcon from 'vue-awesome/components/Icon.vue';
import 'vue-awesome/icons/spinner';

@Component({
  props: {
    windowId: {
      type: Number,
      required: true,
    },
  },
  components: {
    'awesome-icon': AwesomeIcon,
  },
  filters: {
    capitalize: (val) => {
      if (!val) return '';
      const value = val.toString();
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
  },
})
export default class StatusBar extends Vue {
  windowId: number;

  get dummyTabObject(): Lulumi.Store.TabObject {
    return this.$store.getters.tabConfig.dummyTabObject;
  }
  get currentTabIndex(): number | undefined {
    return this.$store.getters.currentTabIndexes[this.windowId];
  }
  get tabs(): Lulumi.Store.TabObject[] {
    return this.$store.getters.tabs.filter(tab => tab.windowId === this.windowId);
  }
  get tab(): Lulumi.Store.TabObject {
    if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
      return this.dummyTabObject;
    }
    return this.tabs[this.currentTabIndex];
  }

  onClick(event: MouseEvent): void {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);

    if (currentWindow) {
      const { Menu, MenuItem } = this.$electron.remote;
      const menu = new Menu();

      menu.append(new MenuItem({
        label: 'test',
      }));

      menu.popup({
        x: event.clientX - event.offsetX,
        y: event.clientY - (event.target as HTMLElement).clientHeight - event.offsetY,
        window: currentWindow,
      });
    }
  }
}
</script>

<style lang="less" scoped>
@font-face {
  font-family: Cascadia;
  src: url('../../fonts/Cascadia.ttf') format('truetype');
}

#status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 22px;
  background: #007acc;
  color: #ffffff;
  cursor: default;
  font-family: Cascadia, 'Source Sans Pro', sans-serif;
  font-size: 12px;

  .status-item {
    display: flex;
    align-items: center;
    line-height: 22px;
    text-overflow: ellipsis;
    padding: 0 10px 0 0;

    &.left {
      float: left;
      padding-left: 10px;

      svg {
        padding: 0 5px;
      }
    }

    &.right {
      float: right;
      padding-right: 10px;

      svg {
        padding: 0 5px;
      }
    }

    &:hover {
      background: #0099ff6f;
      cursor: pointer;
      user-select: none;
    }
  }
}
</style>
