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
const configured = (process.env.GOOGLE_SHEET_RANGE || '리드').trim();
const rawName = configured.includes('!') ? configured.slice(0, configured.lastIndexOf('!')) : configured;
const sheetName = rawName.replace(/^'(.*)'$/, '$1').replace(/''/g, "'");
const sheetRef = `'${sheetName.replace(/'/g, "''")}'`;
const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
export const sheetsReady = Boolean(clientEmail && privateKey && sheetId);
export const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : '';

async function authorize(readonly = false) {
    if (!sheetsReady) throw new Error('Google Sheets 환경변수가 설정되지 않았습니다.');
    const client = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [`https://www.googleapis.com/auth/spreadsheets${readonly ? '.readonly' : ''}`],
    });
    const { access_token: token } = await client.authorize();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
async function checked(response: Response) {
    if (!response.ok) throw new Error(`Sheets ${response.status}: ${await response.text()}`);
    return response;
}

/** 기존 열 위치를 유지하면서 부족한 열과 빈 헤더만 추가한다. */
async function prepareSheet(headers: Record<string, string>) {
    const response = await checked(await fetch(`${baseUrl}?fields=sheets.properties`, { headers, cache: 'no-store' }));
    const data = (await response.json()) as {
        sheets: { properties: { sheetId: number; title: string; gridProperties: { columnCount: number } } }[];
    };
    const sheet = data.sheets.find((item) => item.properties.title === sheetName)?.properties;
    if (!sheet) throw new Error(`Google Sheets 탭을 찾지 못했습니다: ${sheetName}`);
    if (sheet.gridProperties.columnCount < LEAD_COLUMNS.length) {
        await checked(
            await fetch(`${baseUrl}:batchUpdate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    requests: [
                        {
                            appendDimension: {
                                sheetId: sheet.sheetId,
                                dimension: 'COLUMNS',
                                length: LEAD_COLUMNS.length - sheet.gridProperties.columnCount,
                            },
                        },
                    ],
                }),
            }),
        );
    }
    const range = encodeURIComponent(`${sheetRef}!A1:${lastColumn}1`);
    const currentResponse = await checked(await fetch(`${baseUrl}/values/${range}`, { headers, cache: 'no-store' }));
    const current = ((await currentResponse.json()) as { values?: string[][] }).values?.[0] || [];
    const missing = LEAD_COLUMNS.flatMap((name, index) =>
        current[index]
            ? []
            : [
                  {
                      range: `${sheetRef}!${columnName(index + 1)}1`,
                      values: [[name]],
                  },
              ],
    );
    if (missing.length) {
        await checked(
            await fetch(`${baseUrl}/values:batchUpdate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ valueInputOption: 'RAW', data: missing }),
            }),
        );
    }
}
export async function appendLeadRow(row: string[]) {
    const headers = await authorize();
    await prepareSheet(headers);
    // 행 번호를 계산해 덮어쓰지 않고 Sheets에서 다음 행을 결정한다.
    const range = encodeURIComponent(`${sheetRef}!A:A`);
    await checked(
        await fetch(`${baseUrl}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ majorDimension: 'ROWS', values: [row] }),
        }),
    );
}
/** 관리자 조회는 읽기 전용이며, 아직 확장 전인 시트도 읽을 수 있다. */
export async function readLeadRows(): Promise<string[][]> {
    const headers = await authorize(true);
    const response = await checked(
        await fetch(`${baseUrl}/values/${encodeURIComponent(sheetRef)}`, { headers, cache: 'no-store' }),
    );
    const data = (await response.json()) as { values?: string[][] };
    return (data.values || [])
        .slice(1)
        .filter((row) => row[0])
        .map((row) => row.slice(0, LEAD_COLUMNS.length));
}
