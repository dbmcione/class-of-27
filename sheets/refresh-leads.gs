/**
 * Adds new students to a Google Sheet from Supabase.
 *
 * APPEND ONLY, and that is the whole design. The automation downstream fires
 * on "a new row appeared", so a row must mean one thing: a student who has
 * not been messaged yet. Existing rows are never moved, renumbered or
 * rewritten, because any of those would read as new rows and message people
 * a second time.
 *
 * A student already in the sheet is skipped, matched on phone, which is
 * unique in the database. So a rerun is harmless and a missed run just
 * catches up on the next one.
 *
 * The credentials are NOT in this file. They live in Script Properties, set
 * once in the editor, so the key is not sitting in something you might share.
 */

/** The view to read. Its columns become the sheet's columns, in order. */
var VIEW = 'lead_export';

/**
 * Sorting is not cosmetic here. PostgREST pages with limit and offset, and
 * without an order the database may hand back the same row twice across two
 * pages and drop another. Phone is unique, so it orders the pages stably.
 */
var ORDER = 'phone.asc';

/** PostgREST caps a response at 1000 rows, so it is read a page at a time. */
var PAGE = 1000;

function refreshLeads() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL');
  var key = props.getProperty('SUPABASE_KEY');

  if (!url || !key) {
    throw new Error(
      'Set SUPABASE_URL and SUPABASE_KEY in Project Settings, Script Properties.'
    );
  }

  var rows = fetchAll_(url.replace(/\/+$/, ''), key);
  if (rows.length === 0) {
    Logger.log('Supabase returned no students. Nothing to add.');
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var headers = Object.keys(rows[0]);
  writeHeadersIfMissing_(sheet, headers);

  var known = existingPhones_(sheet);
  var fresh = rows.filter(function (row) {
    return !known[String(row.phone)];
  });

  if (fresh.length === 0) {
    Logger.log('No new students. Sheet untouched.');
    return;
  }

  var table = fresh.map(function (row) {
    return headers.map(function (h) {
      return row[h] === null || row[h] === undefined ? '' : row[h];
    });
  });

  sheet
    .getRange(sheet.getLastRow() + 1, 1, table.length, headers.length)
    .setValues(table);

  Logger.log('Added ' + fresh.length + ' new student(s).');
}

function writeHeadersIfMissing_(sheet, headers) {
  if (sheet.getLastRow() > 0) return;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  // A phone number is an identifier, not a quantity. Left as a number, Sheets
  // would be free to render it as 9.87654E+09 and hand that to the automation.
  sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
}

/** Phones already in column A, as a lookup. */
function existingPhones_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return {};

  var values = sheet.getRange(2, 1, last - 1, 1).getValues();
  var seen = {};
  values.forEach(function (r) {
    var phone = String(r[0]).trim();
    if (phone) seen[phone] = true;
  });
  return seen;
}

function fetchAll_(url, key) {
  var all = [];
  var offset = 0;

  while (true) {
    var endpoint =
      url + '/rest/v1/' + VIEW +
      '?select=*&order=' + ORDER + '&limit=' + PAGE + '&offset=' + offset;

    var res = UrlFetchApp.fetch(endpoint, {
      method: 'get',
      headers: { apikey: key, Authorization: 'Bearer ' + key },
      muteHttpExceptions: true,
    });

    var code = res.getResponseCode();
    if (code !== 200) {
      // Fail loudly. A silent failure here looks exactly like "no new students".
      throw new Error('Supabase returned ' + code + ': ' + res.getContentText());
    }

    var page = JSON.parse(res.getContentText());
    all = all.concat(page);
    if (page.length < PAGE) return all;
    offset += PAGE;
  }
}

/** Run once by hand to start the timer. Safe to re-run; it replaces the old one. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshLeads') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshLeads').timeBased().everyMinutes(15).create();
  Logger.log('Refreshing every 15 minutes.');
}
