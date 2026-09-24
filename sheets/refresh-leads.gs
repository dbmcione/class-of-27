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
 * The database stores the answers page's short code, not its address. The
 * app's address belongs in one place, and that place is not a database
 * column that would need a migration when the domain changes. Set GAME_URL
 * in Script Properties and this turns the code into a link for the message.
 */
var CODE_COLUMN = 'answers_code';
var LINK_COLUMN = 'answers_url';

/**
 * The automation's own column. Every new row starts Pending and Make writes
 * Success or Failure over it once it has sent. Added here and not in the
 * database, because it records what Make did, which the database has no way
 * of knowing.
 *
 * Nothing here ever writes it again. A row is only appended once, so a value
 * Make has set cannot be reset to Pending by a later run.
 */
var RESULT_COLUMN = 'result';
var RESULT_PENDING = 'Pending';

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

  var gameUrl = (props.getProperty('GAME_URL') || '').replace(/\/+$/, '');
  rows = rows.map(function (row) {
    return withAnswersLink_(row, gameUrl);
  });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var headers = Object.keys(rows[0]);
  ensureHeaders_(sheet, headers);

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

/** Swaps the short code for the link the automation actually sends. */
function withAnswersLink_(row, gameUrl) {
  var out = {};
  Object.keys(row).forEach(function (k) {
    if (k !== CODE_COLUMN) {
      out[k] = row[k];
      return;
    }
    out[LINK_COLUMN] = row[k] && gameUrl ? gameUrl + '/a/' + row[k] : '';
  });
  out[RESULT_COLUMN] = RESULT_PENDING;
  return out;
}

/**
 * Writes the header on an empty sheet, and extends it when a column has been
 * added since. Without the second part a sheet that already had rows would
 * keep its old header while new rows arrived a column wider, and the
 * automation, which finds its column by name, would quietly stop working.
 *
 * Only ever touches row 1. Existing rows keep whatever they had.
 */
function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // A phone number is an identifier, not a quantity. Left as a number,
    // Sheets would be free to render it as 9.87654E+09 and hand that to the
    // automation.
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
    return;
  }

  var existing = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var missing = [];
  for (var i = existing.length; i < headers.length; i++) missing.push(headers[i]);
  if (missing.length === 0) return;

  sheet
    .getRange(1, existing.length + 1, 1, missing.length)
    .setValues([missing])
    .setFontWeight('bold');
  Logger.log('Added header(s): ' + missing.join(', '));
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
