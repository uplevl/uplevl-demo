const verbose = process.argv.find((arg) => arg === "--verbose");
const quietLog = process.argv.find((arg) => arg === "--quiet");

module.exports.debug = function debug(message) {
  if (!verbose) {
    return;
  }

  console.log(`Prepare commit msg > DEBUG: ${message}`);
};

module.exports.log = function log(message) {
  if (quietLog) {
    return;
  }

  console.log(`Prepare commit msg > ${message}`);
};

module.exports.error = function error(err) {
  console.error(`Prepare commit msg > ${err}`);
};
