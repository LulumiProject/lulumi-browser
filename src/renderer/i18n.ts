import Vue from 'vue';
import VueI18n from 'vue-i18n';

import enElement from 'element-ui/lib/locale/lang/en';
import zhElement from 'element-ui/lib/locale/lang/zh-CN';
import zhTWElement from 'element-ui/lib/locale/lang/zh-TW';

import en from '../../helper/i18n/en';
import zh from '../../helper/i18n/zh-CN';
import zhTW from '../../helper/i18n/zh-TW';

const lang = require('electron').ipcRenderer.sendSync('request-lang');

Vue.use(VueI18n);

export default new VueI18n({
  locale: lang,
  messages: {
    en: Object.assign(enElement, en),
    'zh-CN': Object.assign(zhElement, zh),
    'zh-TW': Object.assign(zhTWElement, zhTW),
  },
});
