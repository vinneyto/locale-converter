'use strict';

var fs = require('fs');
var path = require('path');
var XLSX = require('xlsx');
var cheerio = require('cheerio');
var colors = require('colors/safe');

/**
 * Конвертирует xls файл в множество json файлов с локализацией
 */
function xls2json(argv) {
  var fileName = String(argv._[1]);
  var dirName = String(path.resolve(argv._[2]));

  if (!fs.existsSync(fileName)) {
    throw new Error(fileName + ' does not exist');
  }

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
      if (cell) {
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
          console.log(colors.yellow('key not found: ' + JSON.stringify(cell_address) + ', stop reading!'));
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
            throw new Error('duplicate key \"' + key + '\": ' + JSON.stringify(cell_address));
          }
          if (cell.v.indexOf('#') === 0) {
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
          if (argv.C) {
            locales[C-1].dict[key] = html2md(locales[C-1].dict[key]);
          }
        }
      }
    }
  }

  // Создаем папку если нужно
  if (!fs.existsSync(dirName)){
    fs.mkdirSync(dirName);
  }

  // Запись в файлы локализаций
  locales.forEach(function(locale) {
    var localeFileName = path.join(dirName, locale.code + '.json');
    fs.writeFileSync(localeFileName, JSON.stringify(locale.dict, null, 4));
  });
}

/**
 * Конвертирует строку в что-то отдаленно напоминающее синтаксис markdown
 * @param htmlStr
 */
function html2md(htmlStr) {

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
}

module.exports = xls2json;