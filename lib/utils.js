'use strict';

var fs = require('fs');
var path = require('path');
var XLSX = require('xlsx');
var colors = require('colors/safe');
var flatten = require('flat');
var _ = require('lodash');

var Utils = {

  readLocaleFromXLS: function(fileName, includeComments, html2md) {
    // Загружаем xls документ
    var workbook = XLSX.readFile(fileName);

    // Получаем первую таблицу
    var worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Получаем диапазон значений таблицы
    var range = XLSX.utils.decode_range(worksheet['!ref']);

    // Ссылка на ячейку
    var cell;

    // Код локализации
    var key;

    // Массив с локализациями
    var locales = [];

    rowsloop:
      for(var R = range.s.r; R <= range.e.r; ++R) {
        for(var C = range.s.c; C <= range.e.c; ++C) {
          var cell_address = XLSX.utils.encode_cell({c:C, r:R});
          cell = worksheet[cell_address];
          // Очищаем строки от передних и задних пробелов
          if (cell && cell.v) {
            cell.v = cell.v.trim();
          }
          if (R == 0) {
            // В первой строке языковые коды
            if (C > 0) {
              // Записываем коды языков
              if (cell) {
                locales.push({ code: cell.v, dict: {} });
              } else {
                // Ячейки с языковыми кодами закончились - прерывание по столбцам
                break;
              }
            }
          } else {
            // Если строка больше 0
            // Записываем переводы в словари локализаций
            if (C == 0 && !cell) {
              console.log(colors.yellow('key not found: ' + JSON.stringify(cell_address) + ', end of document!'));
              break rowsloop;
            }
            if (C <= locales.length && !cell) {
              throw new Error('translation for ' + locales[C-1].code + ' not found: ' + JSON.stringify(cell_address));
            }
            if (C > locales.length) {
              // Вышли за предел доступных локализаций по столбцам
              break;
            }
            if (C == 0) {
              // Сохраняем локализационный код во временную переменную
              if (cell.v in locales[0].dict) {
                throw new Error('duplicate key \"' + cell.v + '\": ' + JSON.stringify(cell_address));
              }
              if (cell.v.indexOf('#') === 0 && !includeComments) {
                // Строка закомментирована - переходим к следующей
                break;
              } else {
                key = cell.v;
              }
            } else {
              if (cell.v != '-') {
                // записываем переводы
                locales[C-1].dict[key] = cell.v;
              } else {
                locales[C-1].dict[key] = locales[0].dict[key];
              }
              // При необходимости преобразуем html теги в строках
              if (html2md) {
                locales[C-1].dict[key] = Utils.convertHtml2md(locales[C-1].dict[key]);
              }
            }
          }
        }
      }
    return locales;
  },

  /**
   * Конвертирует строку в что-то отдаленно напоминающее синтаксис markdown
   * @param htmlStr
   */
  convertHtml2md: function convertHtml2md(htmlStr) {

    var $ = cheerio.load(htmlStr, {
      decodeEntities: false
    });

    $('a').replaceWith(function() {
      var $a = $(this),
        href = $a.attr('href'),
        text = $a.html();
      return '[' + text + '](' + href + ')';
    });

    $('strong,b').replaceWith(function() {
      return '**' + $(this).html() + '**';
    });

    $('em,i').replaceWith(function() {
      return '*' + $(this).html() + '*';
    });

    $('br').replaceWith('||');

    return $.html()
      .replace(/&nbsp;/g, '__')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  },


  readLocalesSync: function (inputDirName) {
    if (!fs.existsSync(inputDirName)) {
      throw new Error(inputDirName + ' dir does not exist');
    }

    // Файлы в директории
    var files = fs.readdirSync(inputDirName);

    files = _.filter(files, file => path.extname(file) === '.json');

    if (!files.length) {
      throw new Error('no json files in directory ' + inputDirName);
    }

    return _.map(files, (file) => {
      var jsonStr = fs.readFileSync(path.join(inputDirName, file));
      return {
        code: path.basename(file, '.json'),
        dict: flatten(JSON.parse(jsonStr))
      }
    });
  }

};

module.exports = Utils;
