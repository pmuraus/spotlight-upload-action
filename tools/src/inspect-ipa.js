const JSZip = require('jszip');
const path = require('path');
const mime = require('mime-types');
const pList = require('simple-plist');

const CF_BUNDLE_SHORT_VERSION_STRING = 'CFBundleShortVersionString';
const CF_BUNDLE_DISPLAY_NAME = 'CFBundleDisplayName';
const CF_BUNDLE_IDENTIFIER = 'CFBundleIdentifier';
const CF_BUNDLE_NAME = 'CFBundleName';

const extract = (file) => {
  const INFO_PLIST = /Payload\/[^./]+\.app\/Info.plist/
  const ipaInfoPromise = extractZipEntryAsBuffer(file, INFO_PLIST)
    .then(({ arrayBuffer }) => pList.parse(Buffer.from(arrayBuffer)))
    .then((pListInfo) => {
      const { CFBundleIcons: { CFBundlePrimaryIcon: { CFBundleIconFiles: [primaryIcon] } } } = pListInfo;
      return {
        metadata: {
          'inuit-bundle-identifier': pListInfo[CF_BUNDLE_IDENTIFIER],
          'inuit-bundle-version': pListInfo[CF_BUNDLE_SHORT_VERSION_STRING],
          'inuit-bundle-primary-icon': primaryIcon,
          'inuit-bundle-title': pListInfo[CF_BUNDLE_DISPLAY_NAME] || pListInfo[CF_BUNDLE_NAME]
        }
      }
    });
  const appIconPromise = ipaInfoPromise.then(({ metadata }) => {
    //it's mandatory for IPA files to have icons
    const iconName = metadata['inuit-bundle-primary-icon']
    const pattern = `Payload\\/[^.\\/]+\\.app\\/${iconName}(@\\dx)?.png`;
    return extractZipEntryAsBuffer(file, new RegExp(pattern));
  });

  return Promise.all([ipaInfoPromise, appIconPromise])
    .then(([{ metadata }, { fileName, arrayBuffer }]) => {
      // eslint-disable-next-line
      const imageFile = new File([arrayBuffer], path.basename(fileName), { type: mime.lookup(fileName) })
      file.metadata = {
        ...metadata,
        'inuit-bundle-primary-icon': path.basename(fileName)
      }
      imageFile.metadata = {
        'inuit-bundle-icon-for': path.basename(fileName)
      }
      return {
        fileList: [
          file,
          imageFile
        ]
      }
    });

}

const extractZipEntryAsBuffer = async (file, filenameRegex) => {
  const jszip = new JSZip()
  const zip = await jszip.loadAsync(file)
  const ret = {}
  for (const entry of Object.values(zip.files)) {
    if (filenameRegex.test(entry.name)) {
      // eslint-disable-next-line
      const buffer = await entry.async('arraybuffer')
      ret.fileName = entry.name
      ret.arrayBuffer = buffer
      break
    }
  }

  return ret
}

module.exports = {
  extract
}