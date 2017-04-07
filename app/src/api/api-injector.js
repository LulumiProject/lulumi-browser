import apiFactory, { initializeExtensionApi } from './api-factory';

export default (VueInstance) => {
  return initializeExtensionApi(apiFactory(VueInstance));
};
