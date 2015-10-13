#! /usr/bin/env node

var colors = require('colors/safe');

var argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('xls2json', 'convert xls(x) file to multiple json locale files')
  .demand(3)
  .example('$0 xls2json test.xlsx output', 'convert test.xlsx to json locale files and put it to output dir')
  .argv;

function main() {
  try {
    require('./lib/' + argv._[0])(argv);
  } catch(e) {
    console.error(colors.red(e));
  }
}

main();


