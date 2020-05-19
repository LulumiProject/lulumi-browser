/* eslint-disable import/prefer-default-export */

import * as types from './mutation-types';

export const actions = {
  updateAbout({ commit }, data) {
    commit(types.UPDATE_ABOUT, data);
  },
  updateExtensions({ commit }, data) {
    commit(types.UPDATE_EXTENSIONS, data);
  },
};
