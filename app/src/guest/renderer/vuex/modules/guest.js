import * as types from '../mutation-types';

const state = {
  about: {
    about: [],
    lulumi: [],
    preferences: [],
  },
};

const mutations = {
  [types.UPDATE_ABOUT](state, data) {
    state.about.about = data.about;
    state.about.lulumi = data.lulumi;
    state.about.preferences = data.preferences;
    if (data.path) {
      state.about.path = data.path;
    }
  },
};

export default {
  state,
  mutations,
};
