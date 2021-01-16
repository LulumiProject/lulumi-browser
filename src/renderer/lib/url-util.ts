import constants from '../mainBrowserWindow/constants';

// characters, then : with optional //
const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::(\/\/)?)(?!\d)/i;
const defaultScheme = 'http://';
const fileScheme = 'file://';
const os: any = require('os');

function getLulumiExtUrl(relativeUrl: string): string {
  return `${constants.lulumiPagesCustomProtocol}://${relativeUrl}`;
}

function privilegedUrls(shortCode: string): string {
  switch (shortCode) {
    case 'about:about':
      return getLulumiExtUrl('about/#/');
    case 'about:downloads':
      return getLulumiExtUrl('about/#/downloads');
    case 'about:extensions':
      return getLulumiExtUrl('about/#/extensions');
    case 'about:history':
      return getLulumiExtUrl('about/#/history');
    case 'about:lulumi':
      return getLulumiExtUrl('about/#/lulumi');
    case 'about:preferences':
      return getLulumiExtUrl('about/#/preferences');
    case 'about:blank':
      return 'about:blank';
    case 'about:newtab':
      return getLulumiExtUrl('about/#/newtab');
    case 'about:playbooks':
      return getLulumiExtUrl('playbooks/#/');
    case 'about:gpu':
      return 'chrome://gpu';
    default:
      return getLulumiExtUrl('about/#/');
  }
}

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
  getScheme(input: string): string | null {
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
  hasScheme(input: string): boolean {
    return !!urlUtil.getScheme(input);
  },

  /**
   * Prepends file scheme for file paths, otherwise the default scheme
   * @param {String} input path, with opetional schema
   * @returns {String} path with a scheme
   */
  prependScheme(input: string): string {
    if (input === undefined || input === null) {
      return input;
    }

    let newInput: string = input;

    // expand relative path
    if (newInput.startsWith('~/')) {
      newInput = newInput.replace(/^~/, os.homedir());
    }

    // detect absolute file paths
    if (newInput.startsWith('/')) {
      newInput = fileScheme + newInput;
    }

    // If there's no scheme, prepend the default scheme
    if (!urlUtil.hasScheme(newInput)) {
      newInput = defaultScheme + newInput;
    }

    return newInput;
  },

  canParseURL(input: string): boolean {
    try {
      const url = new URL(input);
      return !!url;
    } catch (e) {
      return false;
    }
  },

  isImageAddress(url: string): any | null {
    return (url.match(/\.(jpeg|jpg|gif|png|bmp)$/));
  },

  isHttpAddress(url: string): any | null {
    return (url.match(/^https?:\/\/(.*)/));
  },

  /**
   * Checks if a string is not a URL.
   * @param {String} input The input value.
   * @returns {Boolean} Returns true if this is not a valid URL.
   */
  isNotURL(input: string): boolean {
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
  getUrlFromInput(input: string): string {
    if (input === undefined || input === null) {
      return '';
    }

    let newInput: string = input;

    newInput = newInput.trim();
    newInput = urlUtil.getUrlIfPrivileged(newInput).url;
    newInput = urlUtil.prependScheme(newInput);

    if (urlUtil.isNotURL(newInput)) {
      return newInput;
    }

    try {
      return new URL(newInput).href;
    } catch (e) {
      return newInput;
    }
  },

  /**
   * Checks if a given input is a valid URL.
   * @param {String} input The input URL.
   * @returns {Boolean} Whether or not this is a valid URL.
   */
  isURL(input: string): boolean {
    return !urlUtil.isNotURL(input);
  },

  /**
   * Checks if a URL is a view-source URL.
   * @param {String} input The input URL.
   * @returns {Boolean} Whether or not this is a view-source URL.
   */
  isViewSourceUrl(url: string): boolean {
    return url.toLowerCase().startsWith('view-source:');
  },

  /**
   * Checks if a url is a data url.
   * @param {String} input The input url.
   * @returns {Boolean} Whether or not this is a data url.
   */
  isDataUrl(url: string): boolean {
    return url.toLowerCase().startsWith('data:');
  },

  /**
   * Checks if a url is an image data url.
   * @param {String} input The input url.
   * @returns {Boolean} Whether or not this is an image data url.
   */
  isImageDataUrl(url: string): boolean {
    return url.toLowerCase().startsWith('data:image/');
  },

  /**
   * Converts a view-source url into a standard url.
   * @param {String} input The view-source url.
   * @returns {String} A normal url.
   */
  getUrlFromViewSourceUrl(input: string): string {
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
  getViewSourceUrlFromUrl(input: string): string | null {
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
   * Extracts the hostname or returns null.
   * @param {String} input The input URL.
   * @returns {String} The host name.
   */
  getHostname(input: string, excludePort = false): string | null {
    try {
      if (excludePort) {
        return new URL(input).hostname;
      }
      return new URL(input).host;
    } catch (e) {
      return null;
    }
  },

  /**
   * Gets PDF url from a potential PDFJS URL
   * @param {string} url
   * @return {string}
   */
  getUrlIfPDF(url: string): string {
    const PDF_VIEWER_WITH_PDFJS = '/pdfjs/web/viewer.html';
    const PDF_VIEWER_FOR_CHROME = 'chrome://pdf-viewer/index.html?src=';
    if (url) {
      if (url.includes(PDF_VIEWER_WITH_PDFJS)) {
        return url.replace(/^file:.+\/pdfjs\/web\/viewer.html\?file=(\w+:\/\/.+)/, '$1');
      }

      if (url.includes(PDF_VIEWER_FOR_CHROME)) {
        return url.replace(/^chrome:\/\/pdf-viewer\/index\.html\?src=/, '');
      }

      return url;
    }
    return '';
  },

  /**
   * Shows the original url from a error page
   * @param {string} url
   * @return {string}
   */
  getUrlIfError(url: string): string {
    const errorPage = '/pages/error/index.html';
    if (url) {
      if (url.includes(errorPage)) {
        return decodeURIComponent(url).replace(
          /^file:.+\/pages\/error\/index.html\?.*url=(\w+:\/\/.+)/,
          '$1'
        );
      }
      return url;
    }
    return '';
  },

  /**
   * Gets privileged url from a lulumi scheme
   * @param {string} url
   * @return {object}
   */
  getUrlIfPrivileged(url: string): Lulumi.Renderer.AboutLocationObject {
    const pivot = `${constants.lulumiPagesCustomProtocol}://`;

    if (url === 'chrome://gpu/') {
      return {
        omniUrl: `${pivot}gpu`,
        title: 'about:gpu',
        url: privilegedUrls('about:gpu'),
      };
    }
    if (!(url.startsWith('about:') || url.startsWith(pivot))) {
      return {
        url,
        omniUrl: url,
        title: '',
      };
    }
    let newUrl: any = url;
    if (url.startsWith('about:')) {
      newUrl = privilegedUrls(url);
    }
    newUrl = require('url').parse(newUrl);
    if (newUrl.hash) {
      const hash = newUrl.hash.substr(2);
      if (hash === '') {
        return {
          omniUrl: `${pivot}${newUrl.host}`,
          title: `about:${newUrl.host}`,
          // eslint-disable-next-line no-nested-ternary
          url: (process.env.NODE_ENV === 'development')
            ? (newUrl.host === 'playbooks')
              ? `http://localhost:${require('../../../.electron-vue/config').port}/playbooks.html`
              // eslint-disable-next-line max-len
              : `http://localhost:${require('../../../.electron-vue/config').port}/about.html#/${newUrl.host}`
            : privilegedUrls(`about:${newUrl.host}`),
        };
      }
      return {
        omniUrl: `${pivot}${hash}`,
        title: `about:${hash}`,
        url: (process.env.NODE_ENV === 'development')
          // eslint-disable-next-line max-len
          ? `http://localhost:${require('../../../.electron-vue/config').port}/about.html#/${hash}`
          : privilegedUrls(`about:${hash}`),
      };
    }
    return {
      omniUrl: `${pivot}${newUrl.host}`,
      title: `about:${newUrl.host}`,
      // eslint-disable-next-line no-nested-ternary
      url: (process.env.NODE_ENV === 'development')
        ? (newUrl.host === 'playbooks')
          ? `http://localhost:${require('../../../.electron-vue/config').port}/playbooks.html`
          // eslint-disable-next-line max-len
          : `http://localhost:${require('../../../.electron-vue/config').port}/about.html#/${newUrl.host}`
        : privilegedUrls(`about:${newUrl.host}`),
    };
  },

  /**
   * Gets the default favicon URL for a URL.
   * @param {string} url The URL to find a favicon for
   * @return {string} url The base favicon URL
   */
  getDefaultFaviconUrl(url: string): string {
    if (urlUtil.isURL(url)) {
      const loc = new URL(url);
      return `${loc.protocol}//${loc.host}/favicon.ico`;
    }
    return '';
  },

  /**
   * Gets the filename of the image from a URL.
   * @param {string} url The URL to find a filename of the image
   * @return {Promise}
   */
  getFilenameFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new (window as any).Image();
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
