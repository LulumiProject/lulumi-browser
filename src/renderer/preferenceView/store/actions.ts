/* eslint-disable import/prefer-default-export */

import * as types from './mutation-types';

export const actions = {
  updateAbout({ commit }, data: any): void {
    commit(types.UPDATE_ABOUT, data);
  },
  updateExtensions({ commit }, data: any): void {
    commit(types.UPDATE_EXTENSIONS, data);
  },
};
