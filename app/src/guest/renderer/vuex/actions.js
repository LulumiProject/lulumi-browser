import * as types from './mutation-types';

export const updateAbout = ({ commit }, data) => {
  commit(types.UPDATE_ABOUT, data);
};
