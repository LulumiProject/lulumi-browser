<style scoped>
  #browser-navbar {
    display: flex;
    height: 35px;
    width: 100vw;
    padding: 0 5px;
    font-size: 15px;
    font-weight: 100;
    background: linear-gradient(to bottom, #eee, #ddd);
    border-bottom: 1px solid #aaa;
  }

  #browser-navbar a {
    text-decoration: none;
    color: #777;
    cursor: pointer;
  }

  #browser-navbar a:hover {
    text-decoration: none;
    color: blue;
  }

  #browser-navbar a.disabled {
    color: #bbb;
    cursor: default;
  }

  #browser-navbar a {
    flex: 1;
  }

  #browser-navbar .control-group {
    display: flex;
    flex: 1;
    align-items: center;
    justify-items: center;
  }

  #browser-navbar .input-group {
    flex: 9;
    display: flex;
    margin: 0 5px;
  }

  #browser-navbar .input-group input {
    flex: 1;
    margin: 4px 0 3px;
    padding: 0 5px;
    font-size: 14px;
    color: #808080;
    outline: 0;
    box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.2);
    background: #fff;
    border: 1px solid #bbb;
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
  }

  #browser-navbar .input-group input:focus, 
  #browser-navbar .input-group input:active, 
  #browser-navbar .input-group input:hover {
    outline: 0;
    box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.2);
    background: #fff;
    border: 1px solid #bbb;
  }

  #browser-navbar .input-group a {
    border: 1px solid #bbb;
    border-left: 0;
    padding: 4px 0;
    margin: 4px 0 3px;
    flex: 0 0 30px;
    text-align: center;
  }

  #browser-navbar a:last-child {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
  }
</style>

<template lang="pug">
  #browser-navbar
    .control-group
      a(@click="home")
        icon(name="angle-double-left")
      a.disabled(@click="backward")
        icon(name="angle-left")
      a.disabled(@click="forward")
        icon(name="angle-right")
      a(@click="refresh")
        icon(name="refresh")
    .input-group
      input#url-input(type="text", @keyup.enter="go", @click.once="$event.target.select();")
</template>

<script>
  import Icon from 'vue-awesome/components/Icon';
  import 'vue-awesome/icons/angle-double-left';
  import 'vue-awesome/icons/angle-left';
  import 'vue-awesome/icons/angle-right';
  import 'vue-awesome/icons/refresh';

  export default {
    components: {
      Icon,
    },
    methods: {
      home() {
        const webview = document.getElementById('browser-page');
        webview.goToIndex(0);
      },
      backward() {
        const webview = document.getElementById('browser-page');
        webview.goBack();
      },
      forward() {
        const webview = document.getElementById('browser-page');
        webview.goForward();
      },
      refresh() {
        const webview = document.getElementById('browser-page');
        webview.reload();
      },
      go(event) {
        document.getElementById('browser-page').src = event.target.value;
      },
    },
  };
</script>
