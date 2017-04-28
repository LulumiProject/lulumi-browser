import Vue from 'vue';
import VueI18n from 'vue-i18n';

import enElement from 'element-ui/lib/locale/lang/en';
import zhElement from 'element-ui/lib/locale/lang/zh-CN';
import zhTWElement from 'element-ui/lib/locale/lang/zh-TW';

import en from 'i18n/en';
import zh from 'i18n/zh-CN';
import zhTW from 'i18n/zh-TW';

Vue.use(VueI18n);

// eslint-disable-next-line camelcase
export default new VueI18n({
  locale: 'en',
  messages: {
    en: Object.assign(enElement, en),
    'zh-CN': Object.assign(zhElement, zh),
    'zh-TW': Object.assign(zhTWElement, zhTW),
  },
});
