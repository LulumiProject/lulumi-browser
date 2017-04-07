import fs from 'fs';
import path from 'path';
import url from 'url';

// extensionId => manifest
const manifestMap = {};
// name => manifest
const manifestNameMap = {};

const generateExtensionIdFromName = (name) => {
  return name.replace(/[\W_]+/g, '-').toLowerCase();
};

// Create or get manifest object from |srcDirectory|.
const getManifestFromPath = (srcDirectory) => {
  let manifest;
  let manifestContent;

  try {
    manifestContent = fs.readFileSync(path.join(srcDirectory, 'manifest.json'));
  } catch (readError) {
    console.warn(`Reading ${path.join(srcDirectory, 'manifest.json')} failed.`);
    console.warn(readError.stack || readError);
    throw readError;
  }

  try {
    manifest = JSON.parse(manifestContent);
  } catch (parseError) {
    console.warn(`Parsing ${path.join(srcDirectory, 'manifest.json')} failed.`);
    console.warn(parseError.stack || parseError);
    throw parseError;
  }

  if (!manifestNameMap[manifest.name]) {
    const extensionId = generateExtensionIdFromName(manifest.name);
    manifestMap[extensionId] = manifestNameMap[manifest.name] = manifest;
    Object.assign(manifest, {
      srcDirectory: srcDirectory,
      extensionId: extensionId,
      // We can not use 'file://' directly because all resources in the extension
      // will be treated as relative to the root in Chrome.
      startPage: url.format({
        protocol: 'chrome-extension',
        slashes: true,
        hostname: extensionId,
        pathname: manifest.devtools_page
      })
    })
    return manifest;
  } else if (manifest && manifest.name) {
    console.warn(`Attempted to load extension "${manifest.name}" that has already been loaded.`);
  }
};

export {
  getManifestFromPath,
  manifestMap,
  manifestNameMap,
};
