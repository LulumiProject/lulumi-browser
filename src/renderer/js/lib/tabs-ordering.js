import urlResource from './url-resource';

export default (oldPages, tabRefs, newStart, newOrder, immutable = false) => {
  const newPages = [];
  oldPages.map((page, index) => {
    if (newOrder.length === 0) {
      newPages[index] = Object.assign({}, page);
    } else {
      newPages[index] = Object.assign({}, oldPages[newOrder[index]]);
    }
    return true;
  });
  if (!immutable) {
    newPages.map((page, index) => {
      page.pid = newStart + index;
      if (page.location.startsWith('about:')) {
        page.location = urlResource.aboutUrls(page.location);
      }
      return true;
    });
  }
  return newPages;
};
