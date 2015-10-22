#! /usr/bin/env node

var colors = require('colors/safe');

var argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('xls2json', 'convert xls(x) file to multiple json locale files')
  .demand(3)
  .example('$0 xls2json test.xlsx output_dir', 'convert test.xlsx to json locale files and put it to output dir')
  .boolean('C')
  .alias('C', 'html2md')
  .describe('C', 'convert html to markdown')
  .command('json2xls', 'convert multiple json locale files to single xlsx')
  .demand(3)
  .example('$0 json2xls input_dir test.xlsx', 'covert multiple json locale files from input dir to single test.xlsx file')
  .argv;

function main() {
  try {
    require('./lib/' + argv._[0])(argv);
  } catch(e) {
    console.error(colors.red(e));
  }
}

main();


