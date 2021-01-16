/* eslint-disable max-len */

import { nativeImage } from 'electron';
import { fixPathForAsarUnpack } from 'electron-util';
import * as path from 'path';

declare const __static;

const searchEngine = [
  {
    name: 'Google',
    search: 'https://www.google.com/search?ie=UTF-8&q={queryString}',
    autocomplete: 'https://www.google.com/complete/search?client=chrome&q={queryString}',
  },
  {
    name: 'Bing',
    search: 'http://www.bing.com/search?setmkt={language}&q={queryString}',
    autocomplete: 'http://api.bing.com/osjson.aspx?query={queryString}&language={language}',
  },
  {
    name: 'Yahoo!',
    search: 'http://search.yahoo.com/search?ei=UTF-8&fr=crmas&p={queryString}',
    autocomplete: 'http://ff.search.yahoo.com/gossip?output=fxjson&command={queryString}',
  },
  {
    name: 'Yahoo! UK & Ireland',
    search: 'http://uk.search.yahoo.com/search?ei=UTF-8&fr=crmas&p={queryString}',
    autocomplete: 'http://uk-sayt.ff.search.yahoo.com/gossip-uk-sayt?output=fxjson&command={queryString}',
  },
  {
    name: 'Yahoo! JAPAN',
    search: 'http://search.yahoo.co.jp/search?ei=UTF-8&fr=crmas&p={queryString}',
    autocomplete: 'http://search.yahooapis.jp/AssistSearchService/V2/webassistSearch?appid=oQsoxcyxg66enp0TYoirkKoryq6rF8bK76mW0KYxZ0v0WPLtn.Lix6wy8F_LwGWHUII-&output=iejson&p={queryString}',
  },
  {
    name: 'Daum',
    search: 'http://search.daum.net/search?q={queryString}',
    autocomplete: 'http://sug.search.daum.net/search_nsuggest?mod=fxjson&q={queryString}',
  },
  {
    name: 'Naver',
    search: 'http://search.naver.com/search.naver?ie=UTF-8&query={queryString}',
    autocomplete: 'http://ac.search.naver.com/nx/ac?of=os&ie=utf-8&q={queryString}',
  },
  {
    name: 'StartPage',
    search: 'https://www.startpage.com/do/dsearch?prfe=36c84513558a2d34bf0d89ea505333ad9c86bd6598735d590adc2e9be9271a9b5065027ac0acf3048b0efafd7d93a95c&query={queryString}',
    autocomplete: 'https://www.startpage.com/do/suggest?limit=10&format=json&query={queryString}&prfe=36c84513558a2d34bf0d89ea505333ad9c86bd6598735d590adc2e9be9271a9b5065027ac0acf3048b0efafd7d93a95c',
  },
];

const homepage = 'https://github.com/LulumiProject/lulumi-browser';
const pdfViewer = 'pdf-viewer';

const tabConfig: Lulumi.Store.TabConfig = {
  dummyTabObject: {
    browserViewId: -1,
    webContentsId: -1,
    id: -1,
    index: -1,
    windowId: -1,
    highlighted: false,
    active: false,
    pinned: false,
    url: 'about:newtab',
    title: null,
    favIconUrl: null,
    status: null,
    incognito: false,
    statusText: false,
    isLoading: false,
    didNavigate: false,
    isSearching: false,
    canGoBack: false,
    canGoForward: false,
    canRefresh: false,
    error: false,
    hasMedia: false,
    isAudioMuted: false,
    pageActionMapping: {},
    extensionsMetadata: {},
  },
  lulumiDefault: {
    systemFavicon: (typeof __static === 'undefined')
      ? ''
      : nativeImage.createFromPath(fixPathForAsarUnpack(path.join(__static, 'icons', 'icon.png'))).toDataURL(),
    tabFavicon: 'document',
    commandPalette: {
      browsingHistory: 'reading',
      onlineSearch: 'view',
    },
  },
};

const proxyConfig: Electron.Config = {
  pacScript: '',
  proxyRules: '',
  proxyBypassRules: '',
};

// Top 500 alexa sites sorted by popularity
const recommendTopSite: Lulumi.Renderer.SuggestionItem[] = [
  {
    title: 'Gmail',
    value: 'gmail.com',
    url: 'gmail.com',
    icon: 'document',
  },
  {
    title: 'Google',
    value: 'google.com',
    url: 'google.com',
    icon: 'document',
  },
  {
    title: 'Gmail',
    value: 'mail.google.com',
    url: 'mail.google.com',
    icon: 'document',
  },
  {
    title: 'Google Calendar',
    value: 'calendar.google.com',
    url: 'calendar.google.com',
    icon: 'document',
  },
  {
    title: 'Facebook',
    value: 'facebook.com',
    url: 'facebook.com',
    icon: 'document',
  },
  {
    title: 'Youtube',
    value: 'youtube.com',
    url: 'youtube.com',
    icon: 'document',
  },
  {
    title: 'Yahoo',
    value: 'yahoo.com',
    url: 'yahoo.com',
    icon: 'document',
  },
  {
    title: 'Baidu',
    value: 'baidu.com',
    url: 'baidu.com',
    icon: 'document',
  },
  {
    title: 'Wikipedia',
    value: 'wikipedia.com',
    url: 'wikipedia.com',
    icon: 'document',
  },
  {
    title: 'Twitter',
    value: 'twitter.com',
    url: 'twitter.com',
    icon: 'document',
  },
  {
    title: 'Linkedin',
    value: 'linkedin.com',
    url: 'linkedin.com',
    icon: 'document',
  },
  {
    title: 'Pinterest',
    value: 'pinterest.com',
    url: 'pinterest.com',
    icon: 'document',
  },
  {
    title: 'Tumblr',
    value: 'tumblr.com',
    url: 'tumblr.com',
    icon: 'document',
  },
  {
    title: 'Apple',
    value: 'apple.com',
    url: 'apple.com',
    icon: 'document',
  },
  {
    title: 'Imgur',
    value: 'imgur.com',
    url: 'imgur.com',
    icon: 'document',
  },
  {
    title: 'Stack Overflow',
    value: 'stackoverflow.com',
    url: 'stackoverflow.com',
    icon: 'document',
  },
  {
    title: 'Reddit',
    value: 'reddit.com',
    url: 'reddit.com',
    icon: 'document',
  },
  {
    title: 'FC2',
    value: 'fc2.com',
    url: 'fc2.com',
    icon: 'document',
  },
  {
    title: 'Flickr',
    value: 'flickr.com',
    url: 'flickr.com',
    icon: 'document',
  },
  {
    title: 'Netflix',
    value: 'netflix.com',
    url: 'netflix.com',
    icon: 'document',
  },
  {
    title: 'Dropbox',
    value: 'dropbox.com',
    url: 'dropbox.com',
    icon: 'document',
  },
  {
    title: 'Google Taiwan',
    value: 'google.com.tw',
    url: 'google.com.tw',
    icon: 'document',
  },
  {
    title: 'Github',
    value: 'github.com',
    url: 'github.com',
    icon: 'document',
  },
  {
    title: 'PHP',
    value: 'php.net',
    url: 'php.net',
    icon: 'document',
  },
  {
    title: 'Twitch',
    value: 'twitch.tv',
    url: 'twitch.tv',
    icon: 'document',
  },
  {
    title: '9GAG',
    value: '9gag.com',
    url: '9gag.com',
    icon: 'document',
  },
  {
    title: 'eyny',
    value: 'eyny.com',
    url: 'eyny.com',
    icon: 'document',
  },
  {
    title: 'Quora',
    value: 'quora.com',
    url: 'quora.com',
    icon: 'document',
  },
  {
    title: 'CTFtime',
    value: 'ctftime.org',
    url: 'ctftime.org',
    icon: 'document',
  },
  {
    title: '巴哈姆特電玩資訊站',
    value: 'gamer.com.tw',
    url: 'gamer.com.tw',
    icon: 'document',
  },
];

export default {
  tabConfig,
  proxyConfig,
  searchEngine,
  homepage,
  pdfViewer,
  recommendTopSite,
  lulumiPagesCustomProtocol: 'lulumi',
  aboutPages: {
    about: 'List of about pages',
  },
  currentSearchEngine: searchEngine[0],
  autoFetch: false,
};
