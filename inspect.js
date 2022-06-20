const mime = require('mime-types');
const path = require('path');
const yauzl = require('yauzl');
const pList = require('simple-plist');
const log = require('./log');
const fs = require('fs')
const { swaggerTools } = require('spotlight-tools')

const CF_BUNDLE_SHORT_VERSION_STRING = 'CFBundleShortVersionString';
const CF_BUNDLE_DISPLAY_NAME = 'CFBundleDisplayName';
const CF_BUNDLE_IDENTIFIER = 'CFBundleIdentifier';
const CF_BUNDLE_NAME = 'CFBundleName';


const getPublishDestPath = (base, file) => {
  const nBase = path.resolve(path.normalize(base)) + path.sep; //base must be a folder
  const nFile = path.resolve(path.normalize(file));

  if (!nFile.startsWith(nBase)) {
    throw new Error(`${nFile} must under ${nBase}`);
  }

  const dest = nFile.substring(nBase.length);
  if (path.sep !== '/') { // destination must be posix
    return path.posix.join(...dest.split(path.sep));
  }
  return dest;
}

const inspectIpaFile = (file) => {
  const INFO_PLIST = /Payload\/[^./]+\.app\/Info.plist/
  const ipaInfoPromise = extractZipEntryAsBuffer(file, INFO_PLIST)
    .then(({ buffer } ) => pList.parse(buffer))
    .then((pListInfo) => {
      const { CFBundleIcons: { CFBundlePrimaryIcon: { CFBundleIconFiles : [ primaryIcon ] } } } = pListInfo;
      return {
        metadata:  {
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


    return Promise.all([ipaInfoPromise, appIconPromise ])
      .then(([{ metadata }, {fileName, buffer}]) => {
        return {
          fileList: [
            {
              file,
              contentType: 'application/octet-stream',
              metadata: {
                ...metadata,
                'inuit-bundle-primary-icon': path.basename(fileName)
              }
            },
            {
              file: path.join(path.dirname(file), path.basename(fileName)),
              metadata: {
                'inuit-bundle-icon-for': path.basename(file)
              },
              contentType: mime.lookup(fileName),
              buffer
            }
          ]
        }
      });

}

const extractZipEntryAsBuffer = (file, filenameRegex) => {
  return new Promise((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true }, (err, zip) => {
      if (err) {
        reject(err);
        return;
      }
      zip.readEntry();
      zip.on('end', () => reject(new Error('File not found - ' + filenameRegex)));
      zip.on('entry', (entry) => {
        if (filenameRegex.test(entry.fileName)) {
          const buffers = [];
          zip.openReadStream(entry, (err, stream) => {
            if (err) {
              reject(err);
              return;
            }
            stream.on('data', (chunk) => buffers.push(chunk))
            stream.on('end', () => {
              const buffer = Buffer.concat(buffers);
              zip.close();

              resolve( { fileName: entry.fileName, buffer} );
            })
          })
        } else {
          zip.readEntry();
        }
      })
    })
  });
}

inspectFile = (file) => {
  const ext = path.extname(file);
  if (ext === '.ipa') {
    return inspectIpaFile(file)
      .catch(err => {
        log.error(`${path.basename(file)} does not appear to be a valid .ipa file`, err);
        throw err;
      });
  } else {
    return inspectContentFile(file)
  }
}

inspectContentFile = (file) => {
  const fState = fs.statSync(file);
  if (fState.isDirectory()) {
    return new Promise((resolve, reject) => {
      fs.readdir(file, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        const fileList = files.map((f) => path.join(file, f));
        return resolve(inspectContentFilesForUpload(fileList).then((fileList) => ({ fileList })));
      });
    });
  }

  const ext = path.extname(file);
  let contentType
  if (ext === '.json') {
    contentType = swaggerTools.json.getContentType({ path: file })
  } else if (ext === '.yaml') {
    contentType = swaggerTools.yaml.getContentType({ path: file })
  } else {
    contentType = mime.lookup(file)
  }
  return Promise.resolve({
    fileList: [
      {
        file,
        contentType
      }
    ]
  });
}

inspectContentFilesForUpload = (files) => {
  return new Promise((resolve, reject) => {
    const fileList = [];
    let index = 0;
    const next = () => {
      if (index >= files.length) {
        resolve(fileList);
        return;
      }
      const f = files[index];
      index++;

      inspectContentFile(f).then((fileInfo) => {
        fileList.push(...fileInfo.fileList);
        next();
      }, reject);
    }
    next();
  });
}


inspectBuildFilesForUpload = (files) => {
  log('Inspecting ', files.join(','));
  return new Promise((resolve, reject) => {
    const fileList = [];
    let index = 0;
    const next = () => {
      if (index >= files.length) {
        resolve(fileList);
        return;
      }
      const f = files[index];
      index++;
      inspectFile(f).then((fileInfo) => {
        fileList.push(...fileInfo.fileList);
        next();
      }, reject);
    }
    next();
  })
  .then((fileList) => {
    const buildInfo = fileList.reduce((appInfo, file) => {
      appInfo.name = (file.metadata && file.metadata['inuit-bundle-title']) || appInfo.name;
      appInfo.version = (file.metadata && file.metadata['inuit-bundle-version']) || appInfo.version;
      return appInfo;
    }, {});
    return { buildInfo, fileList };
  });
}

module.exports = {
  inspectBuildFilesForUpload,
  inspectContentFilesForUpload,
  getPublishDestPath,
  inspectFile,
  inspectOpenApiFileYaml: swaggerTools.inspectOpenApiFileYaml
}