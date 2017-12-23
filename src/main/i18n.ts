import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { readFileSync } from 'fs';
import { app } from 'electron';
import * as path from 'path';

import enElement from 'element-ui/lib/locale/lang/en';
import zhElement from 'element-ui/lib/locale/lang/zh-CN';
import zhTWElement from 'element-ui/lib/locale/lang/zh-TW';

import * as en from '../../helper/i18n/en';
import * as zh from '../../helper/i18n/zh-CN';
import * as zhTW from '../../helper/i18n/zh-TW';

import config from './js/constants/config';

let langPath;
if (process.env.NODE_ENV === 'development') {
  langPath = path.join(config.devUserData, 'lulumi-lang');
} else if (process.env.NODE_ENV === 'testing') {
  langPath = path.join(config.testUserData, 'lulumi-lang');
} else {
  langPath = path.join(app.getPath('userData'), 'lang');
}

let lang: string = '';
try {
  lang = readFileSync(langPath, 'utf8');
} catch (event) {
  lang = '"en"';
}
lang = JSON.parse(lang);

Vue.use(VueI18n);

export default new VueI18n({
  locale: lang,
  messages: {
    en: Object.assign(enElement, en.appMenu),
    'zh-CN': Object.assign(zhElement, zh.appMenu),
    'zh-TW': Object.assign(zhTWElement, zhTW.appMenu),
  },
});
