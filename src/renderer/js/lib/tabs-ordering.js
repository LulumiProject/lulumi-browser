import urlResource from './url-resource';

export default (oldPages, tabRefs, newStart, newOrder) => {
  const newPages = [];
  if (newOrder.length < oldPages.length) {
    for (let index = 0; index < oldPages.length; index++) {
      newPages[index] = Object.assign({}, oldPages[index]);
    }
  } else {
    oldPages.forEach((page, index) => {
      newPages[index] = Object.assign({}, oldPages[newOrder[index]]);
    });
  }
  newPages.forEach((page, index) => {
    page.pid = newStart + index;
    if (page.location.startsWith('about:')) {
      page.location = urlResource.aboutUrls(page.location);
    }
    if (page.location.startsWith('lulumi-extension:')) {
      page.location = urlResource.aboutUrls('about:newtab');
    }
  });
  return newPages;
};
