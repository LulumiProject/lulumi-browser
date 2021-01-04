/* eslint-disable import/prefer-default-export */

export const getters = {
  about(state: any): void {
    return state.guest.about;
  },
  extensions(state: any): void {
    return state.guest.extensions;
  },
};
