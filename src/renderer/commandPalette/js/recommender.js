import * as Comlink from 'comlink';
import Fuse from 'fuse.js';

function browsingHistories(suggestionItems, niddle) {
  const fuse = new Fuse(suggestionItems, {
    shouldSort: true,
    threshold: 0.4,
    includeMatches: true,
    keys: [{
      name: 'value',
      weight: 0.7,
    }, {
      name: 'title',
      weight: 0.3,
    }],
  });
  return fuse.search(niddle);
}

function onlineSearch(niddle) {
  return fetch(`https://api.github.com/search/repositories?q=${niddle}&sort=stars&order=desc`)
    .then(r => r.json())
    .then(r => r.items)
    .catch();
}

Comlink.expose({
  browsingHistories,
  onlineSearch,
});
