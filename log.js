
const log = (...args) => {
  console.log(...args);
}
log.error = (msg, err) => {
  if (err) {
    if (err.handled !== true) {
      if (err.status) {
        console.error('%s %s', err.status, err.message);
      } else {
        console.error(err.message);
      }
    }
    err.handled = true;
  } else {
    console.error(msg);
  }
}

log.printObject = (name, object) => {
  log(name);
  Object.keys(object)
    .filter(key => object[key] !== null && object[key] !== undefined)
    .forEach((key) => log('\t', key, ':', object[key]));
}

module.exports = log;