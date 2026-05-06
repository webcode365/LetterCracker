# LetterCracker — Google Sheets Auto-Sync Setup Guide
=====================================================
Complete step-by-step setup. Takes about 5 minutes.
After setup, every lead and contact message automatically
appears in your Google Sheet the moment it is submitted.
=====================================================

## STEP 1 — Create Your Google Sheet

1. Go to https://sheets.google.com
2. Click the big "+" button to create a blank new spreadsheet
3. Name it something like: "LetterCracker — Leads & Messages"
4. You are done with this step. Keep the tab open.

## STEP 2 — Open the Script Editor

1. In your Google Sheet, click the top menu: Extensions → Apps Script
2. A new browser tab opens showing a code editor with a blank function
3. DELETE everything already in the editor (select all, then delete)
4. PASTE the entire code block below into the editor

─────────────────────────────────────────────────────────────
PASTE THIS ENTIRE CODE BLOCK INTO THE APPS SCRIPT EDITOR:
─────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type || 'lead';

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;

    // Route to correct sheet tab based on type
    if (type === 'contact_form') {
      sheet = ss.getSheetByName('Contact Messages');
      if (!sheet) {
        sheet = ss.insertSheet('Contact Messages');
        // Add header row for contacts
        sheet.appendRow([
          'Timestamp', 'Name', 'Email', 'Subject', 'Message',
          'Country', 'City', 'Region', 'IP Address', 'ISP',
          'Browser', 'Device Type', 'OS', 'Referrer', 'Page URL'
        ]);
        // Style header row
        sheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#4a90d9').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([
        data.timestamp   || new Date().toISOString(),
        data.name        || '',
        data.email       || '',
        data.subject     || '',
        data.message     || '',
        data.country     || '',
        data.city        || '',
        data.region      || '',
        data.ip          || '',
        data.isp         || '',
        data.browser     || '',
        data.device_type || '',
        data.os          || '',
        data.referrer    || '',
        data.page        || ''
      ]);
    } else {
      // Default: lead (from popup or any other source)
      sheet = ss.getSheetByName('Leads');
      if (!sheet) {
        sheet = ss.insertSheet('Leads');
        // Add header row for leads
        sheet.appendRow([
          'Timestamp', 'Name', 'Email', 'Phone',
          'Country', 'City', 'Region', 'IP Address', 'ISP',
          'Browser', 'Device Type', 'Device Model', 'OS',
          'Referrer', 'Page URL', 'Source'
        ]);
        // Style header row
        sheet.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#2e7d32').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([
        data.timestamp    || new Date().toISOString(),
        data.name         || '',
        data.email        || '',
        data.phone        || '',
        data.country      || '',
        data.city         || '',
        data.region       || '',
        data.ip           || '',
        data.isp          || '',
        data.browser      || '',
        data.device_type  || '',
        data.device_model || '',
        data.os           || '',
        data.referrer     || '',
        data.page         || '',
        data.source       || 'website'
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Data saved successfully.' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// This handles the test connection button in your admin panel
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'LetterCracker Sheets connection is working!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

─────────────────────────────────────────────────────────────
END OF CODE TO PASTE
─────────────────────────────────────────────────────────────


## STEP 3 — Save the Script

1. Click the floppy disk icon (💾) or press Ctrl+S (Cmd+S on Mac)
2. Give the project a name if asked: "LetterCracker Sync"
3. Click OK


## STEP 4 — Deploy as Web App

1. Click the blue "Deploy" button at the top right
2. Click "New deployment"
3. Click the gear icon ⚙️ next to "Type" and select "Web app"
4. Fill in these exact settings:
   - Description: LetterCracker Data Sync
   - Execute as: Me (your Google account)
   - Who has access: Anyone  ← IMPORTANT: must be "Anyone", not "Anyone with Google account"
5. Click "Deploy"
6. Google will ask you to authorize the script — click "Authorize access"
7. Choose your Google account
8. You may see a warning saying "Google hasn't verified this app" — click "Advanced" then "Go to LetterCracker Sync (unsafe)"
   (This is safe — it's YOUR OWN script on YOUR OWN Google account)
9. Click "Allow"
10. After authorization, you will see a screen with your Web App URL


## STEP 5 — Copy Your Web App URL

1. Copy the URL shown — it looks like:
   https://script.google.com/macros/s/AKfycb.../exec
2. Keep this URL private — treat it like a password
3. Do NOT share it publicly


## STEP 6 — Paste URL Into Your Admin Panel

1. Log in to your LetterCracker admin panel
2. Go to: Leads tab → Google Sheets Integration card
   OR: Contact Messages tab → Google Sheets Integration card
   (Both use the same URL — you only need to enter it once)
3. Paste your Web App URL into the "Apps Script Web App URL" field
4. Click "Save URL"
5. Click "Test Connection" — you should see: ✓ Connected! LetterCracker Sheets connection is working!


## STEP 7 — You Are Done!

From this moment:
- Every lead captured from the popup → automatically saved to the "Leads" sheet tab
- Every contact form submission → automatically saved to the "Contact Messages" sheet tab
- Data appears within seconds of submission
- Columns match exactly what is saved in your admin panel

Your Google Sheet will automatically create the correct tabs and column headers
the first time each type of data is received.


## TROUBLESHOOTING

Problem: "Test Connection" shows an error
→ Make sure you set "Who has access" to "Anyone" (not "Anyone with Google account")
→ Try deploying again with a new deployment

Problem: Data not appearing in sheet
→ Check that the URL in admin panel ends in /exec (not /dev)
→ Make sure you clicked "Save URL" in the admin panel

Problem: "This app isn't verified" warning
→ This is normal for your own personal scripts. Click Advanced → Go to app → Allow

Problem: Need to update the script code later
→ In Apps Script, make your changes, click Deploy → Manage deployments → Edit → Save new version


## IMPORTANT NOTES

- The free Google account gives you 6 million cells and unlimited rows — more than enough
- Apps Script runs on Google's servers, completely free
- If you change the deployment (new version), the URL stays the same — no need to update admin panel
- You can share view-only access to the Google Sheet with a team member without sharing the script URL
