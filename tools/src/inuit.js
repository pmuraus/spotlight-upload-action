const superagent = require('superagent');
const fs = require('fs');
const path = require('path');
const log = require('./log');
const https = require('https');

class Inuit {
  constructor(opts) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl;
    this.workspaceRoot = null;
  }

  async uploadAll(fileList) {
    for (let file of fileList) {
      await this.uploadFile(file);
    }
  }

  async uploadFile(file) {
    const fileMd = file.metadata || {};
    const headers = Object.keys(fileMd)
        .reduce((headers, header) => {
          const goog = `x-goog-meta-${header}`;
          headers[goog] = fileMd[header];
          return headers;
        }, {})

    headers['content-type'] = file.contentType;
    headers['cacheControl'] = 'must-revalidate, max-age=900';

    const url = await this.getDestinationUrl(file, headers);
    if (file.contentType) { 
      log.printObject(`Uploading ${path.basename(file.dest)} to ${file.dest} [${file.contentType}]`, fileMd);
    } else {
      log.printObject(`Uploading ${path.basename(file.dest)} to ${file.dest}`, fileMd);
    }

    if (file.buffer) {
      return superagent.put(url).set(headers).send(file.buffer)
    }

    return new Promise((resolve, reject) => {
      const stat = fs.statSync(file.src);
      let written = 0;
      headers['Content-Length'] = stat.size;

      const req = https.request(url, {
        headers,
        method: 'PUT'
      }, (res) => {
        resolve();
      });
      const rs = fs.createReadStream(file.src, { highWaterMark: 1024 * 1024 });
      req.flushHeaders();

      rs.on('data', (data) => {
        req.write(data, (err) => {
          if (err) {
            req.abort();
          }
          written += data.length;
        });
      })
      rs.on('end', () => req.end());
    });
  }

  async getDestinationUrl(file, headers) {
    const filePath = this.baseUrl + path.posix.join('/upload/createUrl/', file.dest) +  '?key=' + this.apiKey;
    log(`Preparing ${filePath}`);
    return superagent
      .post(filePath)
      .set(headers)
      .then(({ body }) => body.url);
  }


}

module.exports = Inuit;