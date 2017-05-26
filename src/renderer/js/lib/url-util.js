import config from '../constants/config';

// characters, then : with optional //
const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::(\/\/)?)(?!\d)/i;
const defaultScheme = 'http://';
const fileScheme = 'file://';
const os = require('os');

/**
 * A simple class for parsing and dealing with URLs.
 * @class urlUtil
 */
const urlUtil = {

  /**
   * Extracts the scheme from a value.
   * @param {String} input The input value.
   * @returns {String} The found scheme.
   */
  getScheme(input) {
    // This function returns one of following:
    // - scheme + ':' (ex. http:)
    // - scheme + '://' (ex. http://)
    // - null
    const scheme = (rscheme.exec(input) || [])[0];
    return scheme === 'localhost://' ? null : scheme;
  },

  /**
   * Checks if an input has a scheme (e.g., http:// or ftp://).
   * @param {String} input The input value.
   * @returns {Boolean} Whether or not the input has a scheme.
   */
  hasScheme(input) {
    return !!urlUtil.getScheme(input);
  },

  /**
   * Prepends file scheme for file paths, otherwise the default scheme
   * @param {String} input path, with opetional schema
   * @returns {String} path with a scheme
   */
  prependScheme(input) {
    if (input === undefined || input === null) {
      return input;
    }

    // expand relative path
    if (input.startsWith('~/')) {
      input = input.replace(/^~/, os.homedir());
    }

    // detect absolute file paths
    if (input.startsWith('/')) {
      input = fileScheme + input;
    }

    // If there's no scheme, prepend the default scheme
    if (!urlUtil.hasScheme(input)) {
      input = defaultScheme + input;
    }

    return input;
  },

  canParseURL(input) {
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      const url = new window.URL(input);
      return !!url;
    } catch (e) {
      return false;
    }
  },

  isImageAddress(url) {
    return (url.match(/\.(jpeg|jpg|gif|png|bmp)$/));
  },

  isHttpAddress(url) {
    return (url.match(/^https?:\/\/(.*)/));
  },

  /**
   * Checks if a string is not a URL.
   * @param {String} input The input value.
   * @returns {Boolean} Returns true if this is not a valid URL.
   */
  isNotURL(input) {
    if (input === undefined || input === null) {
      return true;
    }
    if (typeof input !== 'string') {
      return true;
    }
    // for cases where we have scheme and we dont want spaces in domain names
    const caseDomain = /^[\w]{2,5}:\/\/[^\s/]+\//;
    // for cases, quoted strings
    const case1Reg = /^".*"$/;
    // for cases:
    // - starts with "?" or "."
    // - contains "? "
    // - ends with "." (and was not preceded by a domain or /)
    const case2Reg = /(^\?)|(\?.+\s)|(^\.)|(^[^.+..+]*[^/]*\.$)/;
    // for cases, pure string
    const case3Reg = /[?./\s:]/;
    // for cases, data:uri, view-source:uri and about
    const case4Reg = /^(data|view-source|mailto|about|lulumi|lulumi-extension|magnet):.*/;

    let str = input.trim();
    const scheme = urlUtil.getScheme(str);

    if (str.toLowerCase() === 'localhost') {
      return false;
    }
    if (case1Reg.test(str)) {
      return true;
    }
    if (case2Reg.test(str) || !case3Reg.test(str) ||
        (scheme === undefined && /\s/g.test(str))) {
      return true;
    }
    if (case4Reg.test(str)) {
      return !urlUtil.canParseURL(str);
    }
    if (scheme && (scheme !== 'file://')) {
      return !caseDomain.test(`${str}/`);
    }
    str = urlUtil.prependScheme(str);
    return !urlUtil.canParseURL(str);
  },

  /**
   * Converts an input string into a URL.
   * @param {String} input The input value.
   * @returns {String} The formatted URL.
   */
  getUrlFromInput(input) {
    if (input === undefined || input === null) {
      return '';
    }

    input = input.trim();

    input = urlUtil.prependScheme(input);

    if (urlUtil.isNotURL(input)) {
      return input;
    }

    try {
      return new window.URL(input).href;
    } catch (e) {
      return input;
    }
  },

  /**
   * Checks if a given input is a valid URL.
   * @param {String} input The input URL.
   * @returns {Boolean} Whether or not this is a valid URL.
   */
  isURL(input) {
    return !urlUtil.isNotURL(input);
  },

  /**
   * Checks if a URL is a view-source URL.
   * @param {String} input The input URL.
   * @returns {Boolean} Whether or not this is a view-source URL.
   */
  isViewSourceUrl(url) {
    return url.toLowerCase().startsWith('view-source:');
  },

  /**
   * Checks if a url is a data url.
   * @param {String} input The input url.
   * @returns {Boolean} Whether or not this is a data url.
   */
  isDataUrl(url) {
    return url.toLowerCase().startsWith('data:');
  },

  /**
   * Checks if a url is an image data url.
   * @param {String} input The input url.
   * @returns {Boolean} Whether or not this is an image data url.
   */
  isImageDataUrl(url) {
    return url.toLowerCase().startsWith('data:image/');
  },

  /**
   * Converts a view-source url into a standard url.
   * @param {String} input The view-source url.
   * @returns {String} A normal url.
   */
  getUrlFromViewSourceUrl(input) {
    if (!urlUtil.isViewSourceUrl(input)) {
      return input;
    }
    return urlUtil.getUrlFromInput(input.substring('view-source:'.length));
  },

  /**
   * Converts a URL into a view-source URL.
   * @param {String} input The input URL.
   * @returns {String} The view-source URL.
   */
  getViewSourceUrlFromUrl(input) {
    if (urlUtil.isImageAddress(input) || !urlUtil.isHttpAddress(input)) {
      return null;
    }
    if (urlUtil.isViewSourceUrl(input)) {
      return input;
    }

    // Normalizes the actual URL before the view-source: scheme like prefix.
    return `view-source:${urlUtil.getUrlFromViewSourceUrl(input)}`;
  },

  /**
   * Extracts the hostname or returns undefined.
   * @param {String} input The input URL.
   * @returns {String} The host name.
   */
  getHostname(input, excludePort) {
    try {
      if (excludePort) {
        return new window.URL(input).hostname;
      }
      return new window.URL(input).host;
    } catch (e) {
      return undefined;
    }
  },

  /**
   * Gets PDF location from a potential PDFJS URL
   * @param {string} url
   * @return {string}
   */
  getLocationIfPDF(url) {
    const PDFViewerWithPDFJS = '/pdfjs/web/viewer.html';
    const PDFViewerForChrome = 'chrome://pdf-viewer/index.html?src=';
    if (url) {
      if (url.includes(PDFViewerWithPDFJS)) {
        return url.replace(/^file:.+\/pdfjs\/web\/viewer.html\?file=(\w+:\/\/.+)/, '$1');
      } else if (url.includes(PDFViewerForChrome)) {
        return url.replace(/^chrome:\/\/pdf-viewer\/index\.html\?src=/, '');
      }
      return url;
    }
    return '';
  },

  /**
   * Shows the original location from a error page
   * @param {string} url
   * @return {string}
   */
  getLocationIfError(url) {
    const errorPage = '/pages/error/index.html';
    if (url) {
      if (url.includes(errorPage)) {
        return url.replace(/^file:.+\/pages\/error\/index.html\?.*url=(\w+:\/\/.+)/, '$1');
      }
      return url;
    }
    return '';
  },

  /**
   * Gets about location from a lulumi scheme
   * @param {string} url
   * @return {string}
   */
  getLocationIfAbout(url) {
    if (url.startsWith(config.lulumiPagesCustomProtocol)) {
      const guestUrl = require('url').parse(url);
      const guestHash = guestUrl.hash.substr(2);
      const item = `${guestUrl.host}:${guestHash === '' ? 'about' : guestHash}`;
      return {
        title: item,
        url: item,
      };
    }
    return {
      title: undefined,
      url,
    };
  },

  /**
   * Gets the default favicon URL for a URL.
   * @param {string} url The URL to find a favicon for
   * @return {string} url The base favicon URL
   */
  getDefaultFaviconUrl(url) {
    if (urlUtil.isURL(url)) {
      const loc = new window.URL(url);
      return `${loc.protocol}//${loc.host}/favicon.ico`;
    }
    return '';
  },

  /**
   * Gets the filename of the image from a URL.
   * @param {string} url The URL to find a filename of the image
   * @return {string} filename The filename of the image
   */
  getFilenameFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onerror = () => {
        resolve('');
        reject();
      };
      img.onload = () => {
        const urllib = require('url');
        const path = require('path');
        const parsed = urllib.parse(url);
        resolve(path.basename(parsed.pathname));
      };
      img.src = url;
    });
  },
};

export default urlUtil;
