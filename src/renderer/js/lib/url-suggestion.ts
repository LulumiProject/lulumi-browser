import * as fetchJsonp from 'fetch-jsonp';

const TIMEOUT = 3000;

export default (provider: string, autocomplete: string): Promise<Object[]> => {
  if (provider === 'Google') {
    return fetchJsonp(autocomplete, { timeout: TIMEOUT })
      .then(response => response.json())
      .then(data => data[1]);
  }

  if (provider === 'Bing') {
    return fetchJsonp(`${autocomplete}&JsonType=callback`, {
      timeout: TIMEOUT,
      jsonpCallback: 'JsonCallback',
    })
      .then(response => response.json())
      .then(data => data[1].map(d => [d]));
  }

  return Promise.resolve([]);
};
