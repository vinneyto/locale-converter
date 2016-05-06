'use strict';

var fs = require('fs');
var path = require('path');
var XLSX = require('xlsx');
var colors = require('colors/safe');
var _ = require('lodash');
var Utils = require('../utils');

/**
 * Конвертирует json файлы из папки в xlsx файл
 */
function json2xls(argv) {

  var inputDirName = path.resolve(String(argv._[1]));
  var xlsFileName = String(argv._[2]);

  var i, j;

  // Ключи локализации
  var keys = [];

  // Локализации
  var locales = Utils.readLocalesSync(inputDirName);

  // Составляем полный набор ключей
  _.each(locales, (locale) => {
    // Сохраняем ключи
    _.each(locale.dict, function (value, key) {
      if (!_.includes(keys, key)) {
        keys.push(key);
      }
    });
  });

  // Сортируем ключи
  keys.sort();

  // Сортируем локализации
  locales = _.sortBy(locales, 'code');

  // Английская локализация всегда первая в списке
  for (j = 0; j < locales.length; j++) {
    if (locales[j].code === 'en') {
      var enLocale = locales.splice(j, 1)[0];
      locales.unshift(enLocale);
      break;
    }
  }

  // Формируем массив для сохранения в xlsx
  var data = [];
  var row = null;
  var translation;

  // Заполняем строку с заголовками локализаций
  data.push([null]);
  for (j = 0; j < locales.length; j++) {
    data[0].push(locales[j].code);
  }

  // Заполняем строки с локализацией
  for (i = 0; i < keys.length; i++) {
    row = [keys[i]];
    for (j = 0; j < locales.length; j++) {
      translation = locales[j].dict[keys[i]];

      // Если перевод не найден или перевод соответствует первому в списке
      if (j > 0) {
        translation = (!translation || translation === locales[0].dict[keys[i]]) ? '-' : translation;
      }

      if (!translation) {
        console.log(colors.yellow('can not find main (en) translation for key: ' + keys[i]));

        row = null;
        break;
      }

      if (translation === '-') {
        console.log('translation not found - locale: ' +
          locales[j].code +
          ', cell: ' + XLSX.utils.encode_cell({c:j+1, r:i+1}) +
          ', key: ' + keys[i]);
      }

      // Экранировние управляющих символов
      translation = translation
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');

      row.push(translation);
    }

    if (row) {
      data.push(row);
    }
  }

  // Создаем и записываем xls книгу
  var wb = new Workbook(), ws = sheet_from_array_of_arrays(data);

  wb.SheetNames.push('Sheet1');
  wb.Sheets['Sheet1'] = ws;

  XLSX.writeFile(wb, xlsFileName);
}

function sheet_from_array_of_arrays(data) {
  var ws = {};
  var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
  for(var R = 0; R != data.length; ++R) {
    for(var C = 0; C != data[R].length; ++C) {
      if(range.s.r > R) range.s.r = R;
      if(range.s.c > C) range.s.c = C;
      if(range.e.r < R) range.e.r = R;
      if(range.e.c < C) range.e.c = C;
      var cell = {v: data[R][C] };
      if(cell.v == null) continue;
      var cell_ref = XLSX.utils.encode_cell({c:C,r:R});

      //if(typeof cell.v === 'number') cell.t = 'n';
      //else if(typeof cell.v === 'boolean') cell.t = 'b';
      //else if(cell.v instanceof Date) {
      //  cell.t = 'n'; cell.z = XLSX.SSF._table[14];
      //  cell.v = datenum(cell.v);
      //}
      //else
      cell.t = 's';

      ws[cell_ref] = cell;
    }
  }
  if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
  return ws;
}

function Workbook() {
  this.SheetNames = [];
  this.Sheets = {};
}

module.exports = json2xls;
