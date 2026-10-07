import { JWT } from 'google-auth-library';
import { LEAD_COLUMNS } from './lead';

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const sheetId = process.env.GOOGLE_SHEET_ID;

const columnName = (count: number): string =>
    count > 26
        ? columnName(Math.floor((count - 1) / 26)) + columnName(((count - 1) % 26) + 1)
        : String.fromCharCode(64 + count);
const lastColumn = columnName(LEAD_COLUMNS.length);
/** 배포 환경변수가 예전 열 범위(A:I)로 남아 있어도 유입정보 열까지 읽도록 시트 이름만 쓴다 */
const sheetName = (process.env.GOOGLE_SHEET_RANGE ?? '리드').split('!')[0];
const sheetRange = `${sheetName}!A:${lastColumn}`;

/** 1행에서 비어 있는 헤더 칸만 채운다. 담당자가 바꿔 둔 이름은 건드리지 않는다 */
async function fillEmptyHeaders(baseUrl: string, token?: string | null) {
    const range = encodeURIComponent(`리드!A1:${lastColumn}1`);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const response = await fetch(`${baseUrl}/values/${range}`, { headers });
    if (!response.ok) return;

    const current = ((await response.json()) as { values?: string[][] }).values?.[0] ?? [];
    const next = LEAD_COLUMNS.map((name, index) => current[index] || name);
    if (next.every((name, index) => name === current[index])) return;

    await fetch(`${baseUrl}/values/${range}?valueInputOption=RAW`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ values: [next] }),
    });
}

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
    const writeRange = encodeURIComponent(`리드!A${nextRow}:${lastColumn}${nextRow}`);

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

    // 문의 행은 이미 저장됐으므로 헤더 정리에 실패해도 접수 실패로 돌리지 않는다
    await fillEmptyHeaders(baseUrl, token).catch((error) => console.warn('[lead] 시트 헤더 채우기 실패', error));
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
