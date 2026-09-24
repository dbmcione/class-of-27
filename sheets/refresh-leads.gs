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
 * The student's scorecard, for the message to attach.
 *
 * Built from the same code as the answers link, because the browser uploads
 * the image to Storage named after it. That is the whole reason no column had
 * to be added to the database: the code IS the filename.
 *
 * It sits next to the answers link, before result, because the two links
 * belong together and result is the automation's own column. Order is safe to
 * change here: the sheet is reconciled by NAME, not by position.
 */
var CARD_COLUMN = 'card_url';
var CARD_BUCKET = 'scorecards';

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
  var apiUrl = url.replace(/\/+$/, '');
  rows = rows.map(function (row) {
    return withLinks_(row, gameUrl, apiUrl);
  });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  // The sheet's own header, which may be wider than ours if someone has added
  // a column of their own. Rows are written to match it.
  var headers = ensureHeaders_(sheet, Object.keys(rows[0]));

  var known = existingPhones_(sheet);
  var fresh = rows.filter(function (row) {
    return !known[String(row.phone)];
  });

  if (fresh.length === 0) {
    Logger.log('No new students. Sheet untouched.');
    return;
  }

  // Only the rows about to be written, never the whole database. A card can
  // be missing when the student's phone dropped off the network before the
  // upload finished, and a link to a file that is not there would reach them
  // as a broken image. Blank is better: the automation can send text only.
  fresh.forEach(function (row) {
    if (row[CARD_COLUMN] && !imageExists_(row[CARD_COLUMN])) row[CARD_COLUMN] = '';
  });

  var table = fresh.map(function (row) {
    return headers.map(function (h) {
      // A column of someone else's gets an empty cell, not a guess.
      return row[h] === null || row[h] === undefined ? '' : row[h];
    });
  });

  sheet
    .getRange(sheet.getLastRow() + 1, 1, table.length, headers.length)
    .setValues(table);

  Logger.log('Added ' + fresh.length + ' new student(s).');
}

/**
 * Turns the play's short code into the two links the automation sends: the
 * answers page and the scorecard image. Both are derived, neither is stored.
 */
function withLinks_(row, gameUrl, apiUrl) {
  var code = row[CODE_COLUMN];
  var out = {};

  Object.keys(row).forEach(function (k) {
    if (k !== CODE_COLUMN) {
      out[k] = row[k];
      return;
    }
    out[LINK_COLUMN] = code && gameUrl ? gameUrl + '/a/' + code : '';
  });

  out[CARD_COLUMN] =
    code && apiUrl
      ? apiUrl + '/storage/v1/object/public/' + CARD_BUCKET + '/' + code + '.jpg'
      : '';
  // Last, because it is the automation's, not ours.
  out[RESULT_COLUMN] = RESULT_PENDING;
  return out;
}

/** Is the card actually in the bucket? A HEAD, so nothing is downloaded. */
function imageExists_(imageUrl) {
  try {
    var res = UrlFetchApp.fetch(imageUrl, { method: 'head', muteHttpExceptions: true });
    return res.getResponseCode() === 200;
  } catch (err) {
    // A blip at this end is not evidence the card is missing. Keep the link.
    return true;
  }
}

/**
 * Makes the sheet's header match the columns we have, and returns the header
 * as the sheet now actually reads it.
 *
 * Everything downstream works off that returned list rather than off our own
 * order, which is what lets a column be added in the middle. A new column is
 * INSERTED at its proper place, so the cells to its right shift with it and
 * every existing row keeps its values under the right heading — including
 * result, which by then holds what Make wrote.
 *
 * Columns are never moved or removed, only added. A heading someone has added
 * by hand is left exactly where it is.
 */
function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // A phone number is an identifier, not a quantity. Left as a number,
    // Sheets would be free to render it as 9.87654E+09 and hand that to the
    // automation.
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
    return headers.slice();
  }

  var current = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (h) {
      return String(h).trim();
    });

  var added = [];

  headers.forEach(function (name) {
    if (current.indexOf(name) !== -1) return;

    // Where it belongs: just after the column that precedes it in our order
    // and is already on the sheet. Falling back to the far right when none of
    // them is, which is the case for a sheet with a header we do not know.
    var at = current.length;
    var ours = headers.indexOf(name);
    for (var i = ours - 1; i >= 0; i--) {
      var beforeAt = current.indexOf(headers[i]);
      if (beforeAt !== -1) {
        at = beforeAt + 1;
        break;
      }
    }

    if (at < current.length) {
      sheet.insertColumnBefore(at + 1);
    }
    sheet.getRange(1, at + 1).setValue(name).setFontWeight('bold');
    current.splice(at, 0, name);
    added.push(name);
  });

  if (added.length > 0) Logger.log('Added column(s): ' + added.join(', '));
  return current;
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
