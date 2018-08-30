import * as types from '../mutation-types';

const state = {
  about: {
    about: [],
    lulumi: [],
    preferences: [],
  },
  extensions: {},
};

/* tslint:disable:function-name */
const mutations = {
  [types.UPDATE_ABOUT](state, data) {
    state.about.about = data.about;
    state.about.lulumi = data.lulumi;
    state.about.preferences = data.preferences;
    if (data.path) {
      state.about.path = data.path;
    }
  },
  [types.UPDATE_EXTENSIONS](state, data) {
    state.extensions = data;
  },
};

export default {
  state,
  mutations,
};
