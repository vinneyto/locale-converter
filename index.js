#! /usr/bin/env node

var colors = require('colors/safe');
var yargs = require('yargs');

var argv = yargs
  .usage('Usage: $0 <command> [options]')
  .command('xls2json', 'convert xls(x) file to multiple json locale files')
  .demand(3)
  .example('$0 xls2json test.xlsx output_dir', 'convert test.xlsx to json locale files and put it to output dir')
  .boolean('m')
  .alias('m', 'html2md')
  .describe('m', 'convert html to markdown on xls2json')
  .boolean('c')
  .alias('c', 'comments')
  .describe('c', 'include # comments on xls2json')
  .command('json2xls', 'convert multiple json locale files to single xlsx')
  .demand(3)
  .example('$0 json2xls input_dir test.xlsx', 'covert multiple json locale files from input dir to single test.xlsx file')
  .argv;

function main() {
  try {
    var commands = ['xls2json', 'json2xls'];

    if (commands.indexOf(argv._[0]) >= 0) {
      require('./lib/' + argv._[0])(argv);
    } else {
      yargs.showHelp();
    }
  } catch(e) {
    console.error(colors.red(e));
  }
}

main();


