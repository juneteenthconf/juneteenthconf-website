/**
 * Juneteenth Conference 2026 — CFP Submission Handler
 *
 * HOW TO DEPLOY:
 *  1. Create a new Google Sheet (this will hold all submissions)
 *  2. In that sheet: Extensions > Apps Script
 *  3. Delete any existing code and paste this entire file
 *  4. Click Save, then Deploy > New Deployment
 *  5. Type: Web App
 *     Execute as: Me
 *     Who has access: Anyone
 *  6. Click Deploy, authorize the permissions
 *  7. Copy the Web App URL
 *  8. In cfp.astro, replace REPLACE_WITH_YOUR_APPS_SCRIPT_URL with that URL
 *  9. Commit and push — done
 *
 * Submissions will appear as rows in the sheet, one per speaker.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Write header row on first submission
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Submitted At', 'Name', 'Email', 'Pronouns', 'Title & Company',
        'City/State', 'Bio', 'Headshot URL', 'LinkedIn', 'Twitter/X',
        'Session Title', 'Format', 'Track', 'Audience Level',
        'Abstract', 'Key Takeaways', 'Past Talk Links', 'Spoken at JTC Before?',
        'Status'
      ];
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setColumnWidth(1, 160);  // Submitted At
      sheet.setColumnWidth(7, 300);  // Bio
      sheet.setColumnWidth(15, 400); // Abstract
      sheet.setColumnWidth(16, 300); // Key Takeaways
    }

    sheet.appendRow([
      new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
      data.name || '',
      data.email || '',
      data.pronouns || '',
      data.titleCompany || '',
      data.cityState || '',
      data.bio || '',
      data.headshotUrl || '',
      data.linkedin || '',
      data.twitter || '',
      data.sessionTitle || '',
      data.sessionType || '',
      data.track || '',
      data.audienceLevel || '',
      data.abstract || '',
      data.keyTakeaways || '',
      data.pastTalks || '',
      data.spokenAtJtcBefore || '',
      'Pending'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
