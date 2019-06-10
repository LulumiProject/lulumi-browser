import * as Comlink from 'comlink';
import Fuse from 'fuse.js';

function search(suggestionItems, niddle) {
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

Comlink.expose(search);
