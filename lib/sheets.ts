import { JWT } from 'google-auth-library';

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const sheetId = process.env.GOOGLE_SHEET_ID;
const sheetRange = process.env.GOOGLE_SHEET_RANGE ?? '리드!A:H';

export const sheetsReady = Boolean(clientEmail && privateKey && sheetId);

export const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : '';

export async function appendLeadRow(row: string[]) {
    if (!sheetsReady) throw new Error('Google Sheets 환경변수가 설정되지 않았습니다.');

    const client = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const { access_token: token } = await client.authorize();

    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
    });

    if (!response.ok) throw new Error(`Sheets ${response.status}: ${await response.text()}`);
}

/** 관리자 화면용. 시트를 읽기만 하고 서버에 저장하지 않는다. */
export async function readLeadRows(): Promise<string[][]> {
    if (!sheetsReady) throw new Error('Google Sheets 환경변수가 설정되지 않았습니다.');

    const client = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const { access_token: token } = await client.authorize();

    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetRange)}`;
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Sheets ${response.status}: ${await response.text()}`);

    const payload = (await response.json()) as { values?: string[][] };
    // 1행은 헤더
    return (payload.values ?? []).slice(1);
}
