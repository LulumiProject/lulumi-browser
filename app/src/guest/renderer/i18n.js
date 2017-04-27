import Vue from 'vue';
import VueI18n from 'vue-i18n';

import enElement from 'element-ui/lib/locale/lang/en';
import zhElement from 'element-ui/lib/locale/lang/zh-CN';
import zhTWElement from 'element-ui/lib/locale/lang/zh-TW';

import * as en from 'i18n/en';
import * as zh from 'i18n/zh-CN';
import * as zhTW from 'i18n/zh-TW';

Vue.use(VueI18n);

// eslint-disable-next-line camelcase
export default new VueI18n({
  locale: 'en',
  messages: {
    en: Object.assign(enElement, en.guest),
    'zh-CN': Object.assign(zhElement, zh.guest),
    'zh-TW': Object.assign(zhTWElement, zhTW.guest),
  },
});
