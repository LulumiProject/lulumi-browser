import * as types from './mutation-types';

export const updateAbout = ({ commit }, data) => {
  commit(types.UPDATE_ABOUT, data);
};
export const updateExtensions = ({ commit }, data) => {
  commit(types.UPDATE_EXTENSIONS, data);
};
