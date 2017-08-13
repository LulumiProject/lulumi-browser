import { remote } from 'electron';

// Refs: http://ithelp.ithome.com.tw/articles/10188558
class Tab {
  id: number;
  index: number;
  windowId: number;
  openerTabId: number;
  highlighted: boolean;
  active: boolean;
  pinned: boolean;
  url: string | null;
  title: string | null;
  favIconUrl: string | null;
  status: string;
  incognito: boolean;
  width: number;
  height: number;
  sessionId: number;
  constructor(windowid:number, id: number, index: number, active: boolean) {
    this.id = id; // 頁籤的標識符。(某些狀況可能會沒有id)
    this.index = index; // 頁籤在所在窗口中的索引，從 0 開始。
    this.windowId = windowid; // 頁籤所在窗口的標識符。
    this.openerTabId; // 使用哪個已存在的頁籤打開指定的網址。
    this.highlighted = active; // 頁籤是否為高亮狀態。
    this.active = active; // 頁籤是否是窗口中的活動頁籤。 （因為視窗不一定是focus的狀態。）
    this.pinned = false; // 頁籤是否固定。(指定為tue的頁籤，不能移動，也沒有關閉鈕)
    this.url; // 頁籤中顯示的 URL。需要 "tabs" 權限
    this.title; // 頁籤的標題，如果頁籤正在加載它也可能是空字符串。需要 "tabs" 權限
    this.favIconUrl; // 頁籤的收藏夾圖標 URL，如果頁籤正在加載它也可能是空字符串。需要 "tabs" 權限
    this.status; // "loading"（正在加載）或 "complete"（完成）。
    this.incognito = false; // 頁籤是否在隱身窗口中。
    this.width; // 頁籤寬度，以像素為單位。
    this.height; // 頁籤高度，以像素為單位。
    this.sessionId; // session標識符。(如果使用session匯入tab可能導致沒有tab的id而只有session的id)
  }

  update(url: string | null = null, title: string | null = null, favIconUrl: string | null = null) {
    this.active = remote.getCurrentWindow().isFocused();
    this.url = url;
    this.title = title;
    this.favIconUrl = favIconUrl;
  }

  hightlight(highlighted: boolean = true) {
    this.highlighted = highlighted;
  }

  activate(active: boolean = true) {
    this.hightlight(active);
    this.active = active;
  }
}

export default Tab;
