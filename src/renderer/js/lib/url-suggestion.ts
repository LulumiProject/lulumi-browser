import fetchJsonp from 'fetch-jsonp';
import { renderer } from 'lulumi';

export default (provider: string, autocomplete: string, results: renderer.SuggestionObject[]) => {
  if (provider === 'Google') {
    fetchJsonp(autocomplete)
      .then(response => response.json())
      .then(data => data[1])
      .then((entries) => {
        entries.forEach((entry) => {
          results.push({
            value: entry[0],
            icon: 'search',
          });
        });
      });
  } else if (provider === 'Bing') {
    fetchJsonp(`${autocomplete}&JsonType=callback`, { jsonpCallback: 'JsonCallback' })
      .then(response => response.json())
      .then(data => data[1])
      .then((entries) => {
        entries.forEach((entry) => {
          results.push({
            value: entry,
            icon: 'search',
          });
        });
      });
  }
  return results;
};
