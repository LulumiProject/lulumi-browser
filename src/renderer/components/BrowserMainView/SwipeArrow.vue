<template lang="pug">
  div
    #left-swipe-arrow
      awesome-icon(name="arrow-left")
    #right-swipe-arrow
      awesome-icon(name="arrow-right")
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import AwesomeIcon from 'vue-awesome/components/Icon.vue';
  import 'vue-awesome/icons/arrow-left';
  import 'vue-awesome/icons/arrow-right';

  import BrowserMainView from '../BrowserMainView.vue';

  @Component({
    components: {
      'awesome-icon': AwesomeIcon,
    },
  })
  export default class SwipeArrow extends Vue {
    mounted() {
      window.addEventListener('wheel', (event) => {
        if ((this.$parent as BrowserMainView).onWheel) {
          (this.$parent as BrowserMainView).onWheel(event);
        }
      }, ({ passive: true, capture: true } as any));
    }
  };
</script>

<style lang="less" scoped>
  #left-swipe-arrow, #right-swipe-arrow {
    position: fixed;
    top: ~'calc(50vh)';
    z-index: 1000;
    line-height: 1;
    padding: 10px 12px;
    border-radius: 40px;
    color: #fff;
    background: rgba(0, 0, 0, 0.25);
    transition: background 0.25s;

    &.highlight {
      background: rgba(0, 0, 0, 0.75);
    }
    &.returning {
      transition: left 0.2s, right 0.2s;  
    }
  }
  #left-swipe-arrow {
    left: -200px;

    .fa-icon {
      width: auto;
      height: 3em; /* or any other relative font sizes */
    }
  }
  #right-swipe-arrow {
    right: -200px;

    .fa-icon {
      width: auto;
      height: 3em; /* or any other relative font sizes */
    }
  }
</style>
