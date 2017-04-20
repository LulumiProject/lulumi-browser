class Tab {
  constructor (tabId, active = false) {
    this.id = tabId;
    this.index = tabId;
    this.windowId = 0;
    this.active = active;
    this.highlighted = this.active;
  }

  update (url = null, title = null, favIconUrl = null) {
    this.url = url;
    this.title = title;
    this.favIconUrl = favIconUrl;
  }

  activate (active = true) {
    this.active = active;
    this.highlighted = this.active;
  }
};

export default Tab;
