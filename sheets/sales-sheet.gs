/**
 * Copies every student's Quick Intro and scores into the sales team's sheet,
 * once a day.
 *
 * A STANDALONE script (script.google.com), not one attached to the sheet.
 * Anyone who can edit a sheet can open the script attached to it and read
 * its Script Properties, which here hold the Supabase service-role key: full
 * access to the database. Kept in a separate project that only its owner can
 * open, the sales team can edit the sheet freely without ever seeing the key.
 *
 * The sheet is the sales team's to work in. Rows are matched on phone, so
 * they can filter and add their own columns (call notes, status) to the
 * right or in between. A run only ever writes the columns listed in COLUMNS,
 * and leaves every other column exactly as it was.
 *
 * Rows are kept in the order students first played, oldest first, and put
 * back in that order on every run; whole rows move, so the team's notes move
 * with them. Students who signed up but have not finished a round go last.
 * To see the sheet another way without undoing that, use a filter view
 * (Data, Filter views), which every viewer gets separately.
 *
 * Each run:
 *   - updates every existing student's row (scores change as they replay)
 *   - adds students who are new since the last run, at the bottom
 *   - removes rows for students no longer in the database, i.e. people who
 *     asked to be erased, with two safety checks (see removeErased_)
 *
 * Script Properties (Project Settings, Script Properties):
 *   SUPABASE_URL    https://<project>.supabase.co
 *   SUPABASE_KEY    the service_role key
 *   SALES_SHEET_ID  the long id in the sales sheet's address, between /d/ and /edit
 */

/** The database view to read (supabase/migration-sales-export.sql). */
var VIEW = 'sales_export';

/** The tab written to. Created if it does not exist. */
var TAB = 'Students';

/**
 * [view column, sheet heading], in the order they are first laid out. Order
 * only matters on an empty sheet: after that each column is found by its
 * heading, wherever the sales team has moved it. So rename a heading here
 * and in the sheet together, or the next run adds it again as a new column.
 */
var COLUMNS = [
  ['phone', 'Phone'],
  ['name', 'Name'],
  ['college', 'College'],
  ['state', 'State'],
  ['country', 'Country'],
  ['stage', 'Currently studying'],
  ['timetable_slips', 'My timetable ends up being more of a suggestion than a plan.'],
  [
    'recall_under_pressure',
    'I understand the topic when someone explains it, but I struggle to recall and apply it when I’m solving questions.',
  ],
  ['postpones_mcqs', 'I keep postponing MCQs until I’ve finished studying the subject.'],
  ['best_score', 'Best score'],
  ['best_time', 'Best time'],
  ['rounds_played', 'Rounds played'],
  ['signed_up', 'Signed up'],
  ['first_played_ms', 'First played'],
  ['last_played', 'Last played'],
  ['clicked_course_link', 'Clicked Class of ’27 link'],
  ['found_via', 'Found the game via'],
];

/** PostgREST caps a response at 1000 rows, so it is read a page at a time. */
var PAGE = 1000;

/**
 * Never remove more than this share of the sheet in one run, beyond the
 * first few. Erasures come one or two at a time; a run that wants to remove
 * a quarter of the sheet is almost certainly reading the wrong database, and
 * would take the sales team's notes on those rows with it. The allowance
 * keeps the check from blocking a real erasure on a sheet that is still small.
 */
var MAX_REMOVE_SHARE = 0.25;
var ALWAYS_ALLOW_REMOVING = 5;

function refreshSalesSheet() {
  var props = PropertiesService.getScriptProperties();
  var url = (props.getProperty('SUPABASE_URL') || '').replace(/\/+$/, '');
  var key = props.getProperty('SUPABASE_KEY');
  var sheetId = props.getProperty('SALES_SHEET_ID');
  if (!url || !key || !sheetId) {
    throw new Error(
      'Set SUPABASE_URL, SUPABASE_KEY and SALES_SHEET_ID in Project Settings, Script Properties.'
    );
  }

  // A slow run overlapping the next would write the same new students twice.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) {
    Logger.log('The previous run is still going. Skipping this one.');
    return;
  }

  try {
    var students = fetchAll_(url, key);
    var spreadsheet = SpreadsheetApp.openById(sheetId);
    var sheet = spreadsheet.getSheetByName(TAB) || spreadsheet.insertSheet(TAB);

    var col = ensureColumns_(sheet);
    var phoneCol = col.phone;

    var byPhone = {};
    students.forEach(function (s) {
      byPhone[String(s.phone)] = s;
    });

    removeErased_(sheet, phoneCol, byPhone, students.length);

    // Where each student's row is now, after any removals.
    var rowOf = {};
    var last = sheet.getLastRow();
    if (last >= 2) {
      sheet
        .getRange(2, phoneCol, last - 1, 1)
        .getDisplayValues()
        .forEach(function (r, i) {
          var phone = String(r[0]).trim();
          if (phone) rowOf[phone] = i + 2;
        });
    }

    var added = 0;
    var next = Math.max(last, 1) + 1;
    students.forEach(function (s) {
      var phone = String(s.phone);
      if (!rowOf[phone]) {
        rowOf[phone] = next++;
        added++;
      }
    });

    var lastRow = next - 1;
    if (lastRow >= 2) {
      if (sheet.getMaxRows() < lastRow) {
        sheet.insertRowsAfter(sheet.getMaxRows(), lastRow - sheet.getMaxRows());
      }

      // A phone number is an identifier, not a quantity. Left as a number,
      // Sheets would be free to show it as 9.87654E+09.
      sheet.getRange(2, phoneCol, lastRow - 1, 1).setNumberFormat('@');

      // One column at a time, ours only. Writing whole rows would also
      // rewrite the sales team's columns, turning any formulas there into
      // plain values.
      COLUMNS.forEach(function (c) {
        var range = sheet.getRange(2, col[c[0]], lastRow - 1, 1);
        var values = range.getValues();
        Object.keys(rowOf).forEach(function (phone) {
          var s = byPhone[phone];
          if (!s) return; // a row of the sales team's own, not a student
          values[rowOf[phone] - 2][0] = cellValue_(c[0], s[c[0]]);
        });
        range.setValues(values);
      });

      sheet.getRange(2, col.first_played_ms, lastRow - 1, 1).setNumberFormat('d mmm yyyy, h:mm am/pm');

      // Whole rows, every column, so the team's notes stay with their student.
      // Blank first-played cells sort last.
      if (lastRow > 2) {
        sheet
          .getRange(2, 1, lastRow - 1, sheet.getLastColumn())
          .sort({ column: col.first_played_ms, ascending: true });
      }
    }

    sheet
      .getRange(1, 1)
      .setNote('Updated ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'd MMM yyyy, h:mm a') + ' IST');

    Logger.log(students.length + ' student(s) from the database, ' + added + ' new.');

    // Last, so a problem drawing the dashboard can never stop the student
    // rows above from being written.
    writeDashboard_(spreadsheet, students, new Date());
  } finally {
    lock.releaseLock();
  }
}

/**
 * What goes in the cell. Everything is written as text, except the first-play
 * time: written as "2026-10-05 15:31" in India time, Sheets reads it as a
 * date it can sort on, and those digits stay India time whatever time zone
 * the spreadsheet itself is set to.
 */
function cellValue_(key, v) {
  if (v === null || v === undefined || v === '') return '';
  if (key === 'first_played_ms') {
    return Utilities.formatDate(new Date(Number(v)), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm');
  }
  return String(v);
}

/**
 * Lays the headings out on an empty sheet, adds any missing ones to the far
 * right of a sheet already in use, and returns where each of our columns is.
 */
function ensureColumns_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var header = sheet
    .getRange(1, 1, 1, width)
    .getValues()[0]
    .map(function (h) {
      return String(h).trim();
    });
  var empty = header.every(function (h) {
    return h === '';
  });

  if (empty) {
    var headings = COLUMNS.map(function (c) {
      return c[1];
    });
    sheet.getRange(1, 1, 1, headings.length).setValues([headings]).setFontWeight('bold').setWrap(true);
    sheet.setFrozenRows(1);
    header = headings;
  } else {
    COLUMNS.forEach(function (c) {
      if (header.indexOf(c[1]) !== -1) return;
      header.push(c[1]);
      sheet.getRange(1, header.length).setValue(c[1]).setFontWeight('bold').setWrap(true);
    });
  }

  var col = {};
  COLUMNS.forEach(function (c) {
    col[c[0]] = header.indexOf(c[1]) + 1;
  });
  return col;
}

/**
 * Removes the rows of students no longer in the database, bottom up so the
 * row numbers above stay put.
 *
 * Skipped entirely, with a note in the log, when:
 *   - the database returned nobody at all, or
 *   - it would remove more than ALWAYS_ALLOW_REMOVING rows and more than
 *     MAX_REMOVE_SHARE of the sheet.
 * Either is far likelier to be a wrong key or the wrong project than a real
 * wave of erasures, and the rows carry the sales team's notes.
 */
function removeErased_(sheet, phoneCol, byPhone, studentCount) {
  var last = sheet.getLastRow();
  if (last < 2) return;

  var phones = sheet.getRange(2, phoneCol, last - 1, 1).getDisplayValues();
  var gone = [];
  phones.forEach(function (r, i) {
    var phone = String(r[0]).trim();
    if (phone && !byPhone[phone]) gone.push(i + 2);
  });
  if (gone.length === 0) return;

  var filled = phones.filter(function (r) {
    return String(r[0]).trim() !== '';
  }).length;

  var tooMany = gone.length > ALWAYS_ALLOW_REMOVING && gone.length > filled * MAX_REMOVE_SHARE;
  if (studentCount === 0 || tooMany) {
    Logger.log(
      'Not removing ' + gone.length + ' of ' + filled + ' rows: too many at once. ' +
        'Check SUPABASE_URL points at the game\'s project. Remove them by hand if this is intended.'
    );
    return;
  }

  for (var i = gone.length - 1; i >= 0; i--) sheet.deleteRow(gone[i]);
  Logger.log('Removed ' + gone.length + ' row(s) for students no longer in the database.');
}

function fetchAll_(url, key) {
  var all = [];
  var offset = 0;

  while (true) {
    var res = UrlFetchApp.fetch(
      url + '/rest/v1/' + VIEW + '?select=*&order=phone.asc&limit=' + PAGE + '&offset=' + offset,
      {
        method: 'get',
        headers: { apikey: key, Authorization: 'Bearer ' + key },
        muteHttpExceptions: true,
      }
    );

    if (res.getResponseCode() !== 200) {
      // Fail loudly. A silent failure here would look like "no students".
      throw new Error('Supabase returned ' + res.getResponseCode() + ': ' + res.getContentText());
    }

    var page = JSON.parse(res.getContentText());
    all = all.concat(page);
    if (page.length < PAGE) return all;
    offset += PAGE;
  }
}

// ---------------------------------------------------------------------------
// The Dashboard tab: a handful of quick facts for the sales team.
//
// Refreshed on every run from the same rows the Students tab gets, so it
// costs no extra request to Supabase and always agrees with that tab. Plain
// values, not formulas, so nothing the team does in Students can break it.
//
// The script styles the tab only when it first creates it. After that, a run
// replaces the values and leaves fonts, colours, borders and column widths
// exactly as someone has set them. The one exception is number formats on
// the percentage cells, which are reapplied so a share always reads "40%"
// and never "0.4".
//
// Values are still the script's: anything typed into the tab is replaced on
// the next run. The layout only moves if the categories change, e.g. a new
// campaign link adds a row under HOW THEY FOUND IT and pushes HOW THEY SCORED
// down by one.
// ---------------------------------------------------------------------------

var DASHBOARD_TAB = 'Dashboard';

/** In the order the game's intro offers them, most senior first. */
var STAGES = ['Post-Intern', 'Intern', '4th Year', '3rd Year', '2nd Year', '1st Year'];

var SOUNDS_LIKE_ME = 'Sounds like me';

/** [view column, short label]. The full statements are the Students headings. */
var STATEMENTS = [
  ['timetable_slips', 'Timetable slips'],
  ['recall_under_pressure', 'Struggle to apply'],
  ['postpones_mcqs', 'Postpone MCQs'],
];

/**
 * Hot leads: closest to NEET PG and saying they struggle. A student in one of
 * these years who said "Sounds like me" to at least HOT_LEAD_MIN statements.
 */
var HOT_LEAD_STAGES = ['Intern', 'Post-Intern'];
var HOT_LEAD_MIN = 2;

var DAY_MS = 24 * 60 * 60 * 1000;

/** Set at the start of each dashboard write: true only for a brand-new tab. */
var DASHBOARD_STYLE = false;

function writeDashboard_(spreadsheet, students, now) {
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TAB);
  // Only a brand-new tab gets the default styling; see the note above.
  var style = !sheet;
  DASHBOARD_STYLE = style;
  if (style) {
    sheet = spreadsheet.insertSheet(DASHBOARD_TAB, 0);
  } else {
    sheet.clearContents();
  }

  var total = students.length;
  var weekAgo = now.getTime() - 7 * DAY_MS;
  var yesterday = Utilities.formatDate(new Date(now.getTime() - DAY_MS), 'Asia/Kolkata', 'yyyy-MM-dd');

  var newThisWeek = 0;
  var newYesterday = 0;
  var played = 0;
  var repeat = 0;
  var clicked = 0;
  var clicksTracked = false;
  var hot = 0;
  var stageCount = {};
  var said = STATEMENTS.map(function () {
    return { yes: 0, answered: 0 };
  });
  var colleges = {};
  var states = {};
  var found = {};
  var solvedSum = 0;
  var perfect = 0;

  students.forEach(function (s) {
    var signedUp = signedUpMs_(s);
    if (signedUp !== null) {
      if (signedUp >= weekAgo) newThisWeek++;
      if (Utilities.formatDate(new Date(signedUp), 'Asia/Kolkata', 'yyyy-MM-dd') === yesterday) newYesterday++;
    }

    var rounds = Number(s.rounds_played) || 0;
    if (rounds > 0) played++;
    if (rounds > 1) repeat++;

    if (s.clicked_course_link !== undefined) clicksTracked = true;
    if (s.clicked_course_link === 'Yes') clicked++;

    var stage = s.stage || 'Not given';
    stageCount[stage] = (stageCount[stage] || 0) + 1;

    var yesCount = 0;
    STATEMENTS.forEach(function (st, i) {
      var answer = s[st[0]];
      if (answer) said[i].answered++;
      if (answer === SOUNDS_LIKE_ME) {
        said[i].yes++;
        yesCount++;
      }
    });
    if (HOT_LEAD_STAGES.indexOf(s.stage) !== -1 && yesCount >= HOT_LEAD_MIN) hot++;

    if (s.college) colleges[s.college] = (colleges[s.college] || 0) + 1;
    if (s.state) states[s.state] = (states[s.state] || 0) + 1;

    var via = s.found_via || 'Direct';
    found[via] = (found[via] || 0) + 1;

    var best = /^(\d+)\/(\d+)$/.exec(String(s.best_score || ''));
    if (best) {
      solvedSum += Number(best[1]);
      if (best[1] === best[2]) perfect++;
    }
  });

  var share = function (n, of) {
    return of > 0 ? n / of : 0;
  };

  var heading = sheet.getRange(1, 1).setValue('Spot the Diagnosis: Sales Dashboard');
  var updated = sheet
    .getRange(1, 5)
    .setValue('Updated ' + Utilities.formatDate(now, 'Asia/Kolkata', 'd MMM yyyy, h:mm a') + ' IST');
  if (style) {
    heading.setFontSize(14).setFontWeight('bold');
    updated.setFontColor('#666666');
  }

  // Three blocks across, then three more below the tallest of them.
  var top = 3;
  var h1 = block_(sheet, top, 1, 'AT A GLANCE', [
    ['Total students', total],
    ['New in the last 7 days', newThisWeek],
    ['New yesterday', newYesterday],
    ['Played a round', played],
    ['Not played yet', total - played],
    ['Played more than once', repeat],
    ['Clicked Class of ’27 link', clicksTracked ? clicked : 'Not tracked yet'],
  ]);

  var stageRows = STAGES.concat(
    Object.keys(stageCount).filter(function (k) {
      return STAGES.indexOf(k) === -1;
    })
  )
    .filter(function (k) {
      return stageCount[k];
    })
    .map(function (k) {
      return [k, stageCount[k], share(stageCount[k], total)];
    });
  var h2 = block_(sheet, top, 4, 'WHO THEY ARE', stageRows, [null, null, '0%']);
  h2 += 1 + block_(sheet, top + h2 + 1, 4, 'HOT LEADS', [
    ['Intern / Post-Intern, “Sounds like me” to 2+', hot],
  ]);

  var h3 = block_(
    sheet,
    top,
    8,
    'WHAT THEY TOLD US  (% “Sounds like me”)',
    STATEMENTS.map(function (st, i) {
      return [st[1], share(said[i].yes, said[i].answered)];
    }),
    [null, '0%']
  );

  var second = top + Math.max(h1, h2, h3) + 1;

  block_(sheet, second, 1, 'TOP COLLEGES', topN_(colleges, 10));
  block_(sheet, second, 4, 'TOP STATES', topN_(states, 5));
  var hFound = block_(
    sheet,
    second,
    8,
    'HOW THEY FOUND IT',
    topN_(found, 10).map(function (r) {
      return [r[0], r[1], share(r[1], total)];
    }),
    [null, null, '0%']
  );
  block_(sheet, second + hFound + 1, 8, 'HOW THEY SCORED', [
    ['Average best score', played > 0 ? (solvedSum / played).toFixed(1) + ' / 5' : '—'],
    ['Got a perfect 5/5', played > 0 ? share(perfect, played) : 0],
  ], [null, '0%']);

  if (!style) return;
  sheet.setColumnWidth(1, 300);
  sheet.setColumnWidth(2, 70);
  sheet.setColumnWidth(3, 30);
  sheet.setColumnWidth(4, 260);
  sheet.setColumnWidth(5, 70);
  sheet.setColumnWidth(6, 60);
  sheet.setColumnWidth(7, 30);
  sheet.setColumnWidth(8, 220);
  sheet.setColumnWidth(9, 70);
  sheet.setColumnWidth(10, 60);
  sheet.setHiddenGridlines(true);
}

/**
 * A title and rows of [label, value, ...] at (row, col). formats gives a
 * number format per column, or null. Returns the height used, title included.
 */
function block_(sheet, row, col, title, rows, formats) {
  var titleCell = sheet.getRange(row, col).setValue(title);
  if (DASHBOARD_STYLE) titleCell.setFontWeight('bold').setFontColor('#4a3d8f');
  if (rows.length === 0) {
    var none = sheet.getRange(row + 1, col).setValue('—');
    if (DASHBOARD_STYLE) none.setFontColor('#999999');
    return 2;
  }
  var width = rows[0].length;
  var range = sheet.getRange(row + 1, col, rows.length, width);
  range.setValues(rows);
  if (DASHBOARD_STYLE) {
    range.setVerticalAlignment('middle');
    sheet.getRange(row + 1, col, rows.length, 1).setWrap(true);
  }
  (formats || []).forEach(function (f, i) {
    if (f) sheet.getRange(row + 1, col + i, rows.length, 1).setNumberFormat(f);
  });
  return rows.length + 1;
}

/** The n biggest counts, as [name, count], biggest first. */
function topN_(counts, n) {
  return Object.keys(counts)
    .map(function (k) {
      return [k, counts[k]];
    })
    .sort(function (a, b) {
      return b[1] - a[1] || String(a[0]).localeCompare(String(b[0]));
    })
    .slice(0, n);
}

/**
 * When a student signed up, in milliseconds. From the view's exact time when
 * it has one; otherwise from the "16 Oct 2026" date, taken as the start of
 * that day in India, which is close enough until the view is updated.
 */
function signedUpMs_(s) {
  if (s.signed_up_ms !== undefined && s.signed_up_ms !== null) return Number(s.signed_up_ms);
  if (!s.signed_up) return null;
  try {
    return Utilities.parseDate(String(s.signed_up), 'Asia/Kolkata', 'dd MMM yyyy').getTime();
  } catch (e) {
    return null;
  }
}

/**
 * Run once by hand to start the daily timer. Safe to re-run; it replaces the
 * old one. 7am in the project's time zone: set that to (GMT+05:30) India in
 * Project Settings first, or it is 7am somewhere else.
 */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshSalesSheet') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshSalesSheet').timeBased().everyDays(1).atHour(7).create();
  Logger.log('Refreshing daily at about 7am.');
}
