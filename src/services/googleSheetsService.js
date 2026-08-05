/**
 * Google Sheets API Integration via Native Google OAuth 2.0 (No Apps Script required!)
 */

export const submitToGoogleSheets = async (config, reviewPayload) => {
  // Read credentials from config (Settings UI) or environment variables (.env)
  const clientId = config.googleClientId || getEnvVar('VITE_GOOGLE_CLIENT_ID');
  const clientSecret = config.googleClientSecret || getEnvVar('VITE_GOOGLE_CLIENT_SECRET');
  const refreshToken = config.googleRefreshToken || getEnvVar('VITE_GOOGLE_REFRESH_TOKEN');
  const spreadsheetId = config.googleSpreadsheetId || getEnvVar('VITE_GOOGLE_SPREADSHEET_ID');

  if (!spreadsheetId) {
    console.warn('Google Spreadsheet ID not configured. Saving review locally.');
    return { success: false, reason: 'Google Spreadsheet ID missing' };
  }

  try {
    let accessToken = null;

    // Step 1: Exchange Refresh Token for Access Token if OAuth credentials exist
    if (clientId && clientSecret && refreshToken) {
      accessToken = await getOAuth2AccessToken(clientId, clientSecret, refreshToken);
    }

    if (!accessToken) {
      console.warn('Could not obtain Google OAuth2 Access Token. Please check Client ID, Secret, and Refresh Token.');
      return { success: false, reason: 'OAuth2 Authentication Failed' };
    }

    // Step 2: Prepare Row Values
    const rowValues = [
      reviewPayload.timestamp || new Date().toLocaleString(),
      reviewPayload.name || 'Anonymous',
      `${reviewPayload.rating || 5} Stars`,
      reviewPayload.q1 || '',
      reviewPayload.q2 || '',
      reviewPayload.q3 || '',
      reviewPayload.q4 || '',
      reviewPayload.q5 || '',
      reviewPayload.comment || '',
      reviewPayload.aiUsed || 'No'
    ];

    // Step 3: Call Google Sheets API v4 Append Endpoint
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;

    const sheetsResponse = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowValues]
      })
    });

    if (sheetsResponse.ok) {
      const result = await sheetsResponse.json();
      return { success: true, result };
    } else {
      const errText = await sheetsResponse.text();
      console.error('Google Sheets API Error:', errText);
      return { success: false, error: errText };
    }

  } catch (error) {
    console.error('Error in Google OAuth Sheets dispatch:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exchange Google OAuth 2.0 Refresh Token for an Access Token
 */

const getOAuth2AccessToken = async (clientId, clientSecret, refreshToken) => {
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('client_id', clientId.trim());
    params.append('client_secret', clientSecret.trim());
    params.append('refresh_token', refreshToken.trim());
    params.append('grant_type', 'refresh_token');

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (res.ok) {
      const data = await res.json();
      return data.access_token;
    } else {
      const err = await res.text();
      console.error('OAuth Token Exchange failed:', err);
      return null;
    }
  } catch (e) {
    console.error('Failed to fetch OAuth2 Access Token:', e);
    return null;
  }
};

const getEnvVar = (key) => {
  try {
    return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : '';
  } catch (e) {
    return '';
  }
};
