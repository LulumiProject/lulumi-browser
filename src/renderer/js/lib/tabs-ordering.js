import urlResource from './url-resource';

export default (oldPages, tabRefs, newStart, newOrder, immutable = false) => {
  const newPages = [];
  oldPages.forEach((page, index) => {
    if (newOrder.length === 0) {
      newPages[index] = Object.assign({}, page);
    } else {
      newPages[index] = Object.assign({}, oldPages[newOrder[index]]);
    }
  });
  if (!immutable) {
    newPages.forEach((page, index) => {
      page.pid = newStart + index;
      if (page.location.startsWith('about:')) {
        page.location = urlResource.aboutUrls(page.location);
      }
      if (page.location.startsWith('lulumi-extension:')) {
        page.location = urlResource.aboutUrls('about:newtab');
      }
    });
  }
  return newPages;
};
