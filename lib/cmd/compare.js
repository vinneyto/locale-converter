'use strict';

var fs = require('fs');
var Utils = require('../utils');
var colors = require('colors/safe');
var _ = require('lodash');

function compare(argv) {
  var referenceFile = String(argv._[1]);
  var targetFile = String(argv._[2]);
  var resultFile = String(argv._[3]);
  var localesToCompare = argv.l;
  var changedTypes = argv.t;

  if (!resultFile) {
    throw new Error(`result file not set`);
  }

  var saveAdded   = changedTypes ? _.includes(changedTypes, 'a') : true;
  var saveRemoved = changedTypes ? _.includes(changedTypes, 'r') : true;
  var saveUpdated = changedTypes ? _.includes(changedTypes, 'u') : true;

  console.log(referenceFile);
  console.log(targetFile);

  if (!fs.existsSync(referenceFile)) {
    throw new Error(`${referenceFile} not found`);
  }

  if (!fs.existsSync(targetFile)) {
    throw new Error(`${targetFile} not found`);
  }

  var referenceLocals = Utils.readLocaleFromXLS(referenceFile);
  var targetLocals = Utils.readLocaleFromXLS(targetFile);

  var referenceEnLocale = _.find(referenceLocals, {code: 'en'});
  var targetEnLocale = _.find(targetLocals, {code: 'en'});

  if (!referenceEnLocale) {
    throw new Error(`reference locale does not contains EN language code`);
  }

  if (!targetEnLocale) {
    throw new Error(`target locale does not contains EN language code`);
  }

  /**
   * Массив с объединением множеств всех кодов языков
   */
  var codes = [];

  /**
   * Массив с объединением множеств всех ключей локализации
   */
  var keys = [];

  appendCodes(codes, referenceLocals);
  appendCodes(codes, targetLocals);

  if (localesToCompare) {
    localesToCompare = localesToCompare.split(',');
    codes = _.filter(codes, code => _.includes(localesToCompare, code));
  }

  appendKeys(keys, referenceEnLocale);
  appendKeys(keys, targetEnLocale);

  var key, code, reference, target, result = {};

  for (let i = 0; i < codes.length; i++) {
    code = codes[i];
    for (let j = 0; j < keys.length; j++) {
      key = keys[j];

      reference = getTranslation(referenceLocals, code, key);
      target = getTranslation(targetLocals, code, key);

      if (reference !== target) {
        if (target && !reference) {
          // console.log(colors.green(`added\nlocale: ${code}\nkey: ${key}\nvalue: ${target}`));
          if (saveAdded) {
            pushChangeRecord(result, 'added', {
              locale: code,
              value: target,
              key
            })
          }
        } else if (!target && reference) {
          // console.log(colors.red(`removed\nlocale: ${code}\nkey: ${key}\noldValue: ${reference}`));
          if (saveRemoved) {
            pushChangeRecord(result, 'removed', {
              locale: code,
              oldValue: reference,
              key
            });
          }
        } else {
          // console.log(colors.yellow(`changed\nlocale: ${code}\nkey: ${key}\nnewValue: ${target}\noldValue: ${reference}`));
          if (saveUpdated) {
            pushChangeRecord(result, 'updated', {
              locale: code,
              oldValue: reference,
              newValue: target,
              key
            });
          }
        }
      }
    }
  }

  fs.writeFileSync(resultFile, JSON.stringify(result, null, 4));
}

function appendCodes(codes, locales) {
  _.each(locales, (locale) => {
    if (!_.includes(codes, locale.code)) {
      codes.push(locale.code);
    }
  });
}

function appendKeys(keys, locale) {
  _.each(locale.dict, (value, key) => {
    if (!_.includes(keys, key)) {
      keys.push(key);
    }
  });
}

function getTranslation(locals, code, key) {
  var locale = _.find(locals, {code});
  if (locale) {
    return locale.dict[key];
  }
}

function pushChangeRecord(result, changeType, record) {
  if (!result[changeType]) result[changeType] = {};
  if (!result[changeType][record.locale]) result[changeType][record.locale] = [];
  result[changeType][record.locale].push(record);
}

module.exports = compare;
