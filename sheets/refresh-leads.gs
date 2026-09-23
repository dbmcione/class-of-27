/**
 * Keeps a Google Sheet in step with Supabase.
 *
 * Paste this into the sheet's own Apps Script editor and put it on a timer.
 * Each run replaces the sheet's contents with whatever Supabase holds now, so
 * there is no syncing to go wrong: no duplicate rows, no half-finished merge,
 * and a run that fails simply leaves the last good copy in place until the
 * next one.
 *
 * The credentials are NOT in this file. They live in Script Properties, set
 * once in the editor, so the key is not sitting in something you might share
 * or copy out.
 */

/** The view to read. Its columns become the sheet's columns, in order. */
var VIEW = 'lead_export';

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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (rows.length === 0) {
    // Nothing to write is not the same as an empty database: keep whatever is
    // already there rather than wiping a good sheet on a bad day.
    Logger.log('No rows returned. Sheet left as it was.');
    return;
  }

  var headers = Object.keys(rows[0]);
  var table = [headers].concat(
    rows.map(function (row) {
      return headers.map(function (h) {
        return row[h] === null || row[h] === undefined ? '' : row[h];
      });
    })
  );

  sheet.clear();
  sheet.getRange(1, 1, table.length, headers.length).setValues(table);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  Logger.log('Wrote ' + rows.length + ' rows.');
}

function fetchAll_(url, key) {
  var all = [];
  var offset = 0;

  while (true) {
    var endpoint =
      url + '/rest/v1/' + VIEW + '?select=*&limit=' + PAGE + '&offset=' + offset;

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
