import { JWT } from 'google-auth-library';

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const sheetId = process.env.GOOGLE_SHEET_ID;
const sheetRange = process.env.GOOGLE_SHEET_RANGE ?? '리드!A:I';

export const sheetsReady = Boolean(clientEmail && privateKey && sheetId);

export const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : '';

export async function appendLeadRow(row: string[]) {
    if (!sheetsReady) {
        throw new Error('Google Sheets 환경변수가 설정되지 않았습니다.');
    }

    const client = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const { access_token: token } = await client.authorize();
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;

    const lookupRange = encodeURIComponent('리드!A2:A');
    const lookupResponse = await fetch(`${baseUrl}/values/${lookupRange}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!lookupResponse.ok) {
        throw new Error(`Sheets ${lookupResponse.status}: ${await lookupResponse.text()}`);
    }

    const lookupData = (await lookupResponse.json()) as {
        values?: string[][];
    };

    const nextRow = (lookupData.values?.length ?? 0) + 2;
    const writeRange = encodeURIComponent(`리드!A${nextRow}:I${nextRow}`);

    const response = await fetch(`${baseUrl}/values/${writeRange}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: [row],
        }),
    });

    if (!response.ok) {
        throw new Error(`Sheets ${response.status}: ${await response.text()}`);
    }
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
