import fetchJsonp from 'fetch-jsonp';

export default (provider: string, autocomplete: string): Promise<Object[]> => {
  if (provider === 'Google') {
    return fetchJsonp(autocomplete)
      .then(response => response.json())
      .then(data => data[1]);
  } else if (provider === 'Bing') {
    return fetchJsonp(`${autocomplete}&JsonType=callback`, { jsonpCallback: 'JsonCallback' })
      .then(response => response.json())
      .then(data => data[1].map(d => [d]));
  }
  return Promise.resolve([]);
};
