const searchParams = new URLSearchParams(window.location.search.replace('?', ''));

const h1 = document.getElementById('error-name');
const h2 = document.getElementById('error-desc');
const primaryButton = document.getElementById('primary-button');
const secondaryButton = document.getElementById('secondary-button');

const ec = searchParams.get('ec');
let url = searchParams.get('url');

const websiteNotFound = {
  name: 'Server not found',
  message: "Lulumi-browser couldn't find this website.",
  secondaryAction: {
    title: 'Search on archive.org',
    url: `https://web.archive.org/web/*/${url}`,
  },
};

const sslError = {
  name: 'This website is not available',
  message: "Lulumi-browser couldn't connect securely to this website.",
};

const dnsError = {
  name: 'Website not found',
  messge: 'A DNS error occured.',
};

const offlineError = {
  name: 'You are offline',
  message: 'Reconnect to the internet and try again.',
};

// list: https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h&sq=package:chromium&type=cs
const errorCodes = {
  '-21': offlineError, // network changed
  '-100': {
    name: 'This website is not available',
    message: 'The connection was closed',
  },
  '-101': {
    name: 'This website is not available',
    message: 'The connection was reset',
  },
  '-102': {
    name: 'This website is not available',
    message: 'The connection attempt was refused',
  },
  '-103': {
    name: 'This website is not available',
    message: 'The connection timed out',
  },
  '-104': {
    message: 'Lulumi-browser couldn\'t connect to the website',
  },
  '-105': websiteNotFound,
  '-106': offlineError,
  '-107': sslError,
  '-109': websiteNotFound,
  '-110': sslError, // this is actually the error code for "server requested a client certificate", but we don't support that yet,
  '-112': sslError,
  '-113': sslError,
  '-116': sslError,
  '-117': sslError,
  '-200': {
    name: 'This website is not available.',
    message: "Lulumi-browser couldn't connect securely to this website. (NET::ERR_CERT_COMMON_NAME_INVALID)",
  },
  '-201': {
    name: 'This website is not available',
    message: "Lulumi-browser couldn't connect securely to this website. Please make sure your computer's clock is set correctly.",
  },
  '-202': {
    name: 'This website is not available.',
    message: "Lulumi-browser couldn't connect securely to this website. (NET::ERR_CERT_AUTHORITY_INVALID)",
  },
  '-203': sslError,
  '-204': sslError,
  '-205': sslError,
  '-206': sslError,
  '-207': sslError,
  '-208': sslError,
  '-210': sslError,
  '-211': sslError,
  '-212': sslError,
  '-213': sslError,
  '-300': {
    name: 'This address is invalid.',
  },
  '-501': sslError,
  '-800': dnsError,
  '-801': dnsError,
  '-802': dnsError,
  '-803': dnsError,
  '-804': dnsError,
  '-805': dnsError,
  '-806': dnsError,
};

// show the error message and detail

const err = errorCodes[ec];
if (err) {
  h1.innerHTML += err.name || '';
  h2.innerHTML += err.message || '';
} else {
  h1.innerHTML += 'An error occured';
}

if (err.secondaryAction) {
  secondaryButton.hidden = false;
  secondaryButton.textContent = err.secondaryAction.title;
  secondaryButton.addEventListener('click', () => {
    window.location = err.secondaryAction.url;
  });
}

// if an ssl error occured, "try again" should go to the http:// version, which might work

if (err === sslError) {
  url = url.replace('https://', 'http://');
}

if (url) {
  primaryButton.addEventListener('click', () => {
    window.location = url;
  });
}

primaryButton.focus();
