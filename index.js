const core = require('@actions/core');
const github = require('@actions/github');
const path = require('path');
const sanitize = require("sanitize-filename");
const { muver } = require('spotlight-tools');
const inspect = require("./inspect")
const log = require("./log")

const Inuit = require('./inuit')
const fs = require('fs')
let apiKey = "wD0yhCoraQ78-EjgC-i_BnbBQtM"
const BASE_URL = process.env.SPOTLIGHT_URL || 'https://spotlight.inova.si/f';

const opts = {
    baseUrl: BASE_URL,
}

console.log("here")
let fileList = core.getInput("files").split(",")
console.log(JSON.stringify(fileList, null, 2))
console.log(fs.existsSync(fileList[0]))
console.log(fs.existsSync(fileList[1]))
let n = core.getInput("buildName")
let v = core.getInput("buildVersion")
console.log("here2")
const uploadBuilds = (key) => {
    return inspect.inspectBuildFilesForUpload(fileList)
        .then(({ buildInfo, fileList }) => {
            console.log("here3")
             destBase = 'builds';
            log.printObject('Information collected from files', buildInfo);
            const version = v || buildInfo.version;
            if (!version) {
                failure('Please specify a version for this build.');
                return;
            }
            if (!muver.valid(version)) {
                failure(`${version} is not a valid version.`);
                return;
            }
            const name = n || buildInfo.name;
            if (!name) {
                failure('Please specify a name for this build')
                return;
            }
            const uploadList = fileList.map((f) => ({
                src: f.file,
                dest: path.posix.join('builds', sanitize(name), muver.clean(version), path.basename(f.file)),
                ...f
            }))
            console.log("here4")
            opts.apiKey = key;
            const inuit = new Inuit(opts);
            return inuit.uploadAll(uploadList);
        });
}

uploadBuilds(apiKey)