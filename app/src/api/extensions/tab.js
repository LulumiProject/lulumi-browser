class Tab {
  constructor (tabId, highlighted = false) {
    this.id = tabId;
    this.index = tabId;
    this.windowId = 0;
    this.highlighted = highlighted;
    this.active = highlighted;
  }

  update (url = null, title = null, favIconUrl = null) {
    this.url = url;
    this.title = title;
    this.favIconUrl = favIconUrl;
  }
};

export default Tab;
