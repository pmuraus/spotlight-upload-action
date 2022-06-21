const core = require('@actions/core');
const path = require('path');
const sanitize = require("sanitize-filename");
const { muver, inspect, log, Inuit } = require('spotlight-tools');

const BASE_URL = process.env.SPOTLIGHT_URL || 'https://spotlight.inova.si/f';
const opts = {
    baseUrl: BASE_URL,
}

let apiKey = core.getInput("apiKey")
let fileList = core.getInput("files").split(",")
let n = core.getInput("buildName")
let v = core.getInput("buildVersion")

const uploadBuilds = (key) => {
    return inspect.inspectBuildFilesForUpload(fileList)
        .then(({ buildInfo, fileList }) => {
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
            opts.apiKey = key;
            const inuit = new Inuit(opts);
            return inuit.uploadAll(uploadList);
        });
}

uploadBuilds(apiKey)