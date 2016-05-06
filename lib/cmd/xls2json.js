'use strict';

var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var Utils = require('../utils');

/**
 * Конвертирует xls файл в множество json файлов с локализацией
 */
function xls2json(argv) {
  var fileName = String(argv._[1]);
  var dirName = String(path.resolve(argv._[2]));

  if (!fs.existsSync(fileName)) {
    throw new Error(fileName + ' does not exist');
  }

  var locales = Utils.readLocaleFromXLS(fileName, argv.c, argv.m);

  // Создаем папку если нужно
  if (!fs.existsSync(dirName)){
    fs.mkdirSync(dirName);
  }

  // Запись в файлы локализаций
  locales.forEach(function(locale) {
    var localeFileName = path.join(dirName, locale.code + '.json');
    var jsonString = JSON.stringify(locale.dict, null, 4);

    // Экранирование управляющих символов
    jsonString = jsonString
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\\n')
        .replace(/\\r/g, '\\r');

    fs.writeFileSync(localeFileName, jsonString);
  });
}

module.exports = xls2json;
