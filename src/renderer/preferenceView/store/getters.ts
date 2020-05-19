/* eslint-disable import/prefer-default-export */

export const getters = {
  about(state) {
    return state.guest.about;
  },
  extensions(state) {
    return state.guest.extensions;
  },
};
