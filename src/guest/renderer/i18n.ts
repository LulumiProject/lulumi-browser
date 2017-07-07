import Vue from 'vue';
import VueI18n from 'vue-i18n';

import enElement from 'element-ui/lib/locale/lang/en';
import zhElement from 'element-ui/lib/locale/lang/zh-CN';
import zhTWElement from 'element-ui/lib/locale/lang/zh-TW';

import * as en from '../../../helper/i18n/en';
import * as zh from '../../../helper/i18n/zh-CN';
import * as zhTW from '../../../helper/i18n/zh-TW';

declare const ipcRenderer: any;

// eslint-disable-next-line no-undef
const lang = ipcRenderer.sendSync('request-lang');

Vue.use(VueI18n);

// eslint-disable-next-line camelcase
export default new VueI18n({
  locale: lang,
  messages: {
    en: Object.assign(enElement, en.guest),
    'zh-CN': Object.assign(zhElement, zh.guest),
    'zh-TW': Object.assign(zhTWElement, zhTW.guest),
  },
});
