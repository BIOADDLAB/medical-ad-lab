import { rowToLead } from './lead';
import { readLeadRows, sheetsReady } from './sheets';
import { trafficLabel, visitAttribution } from './traffic';
import {
    dayKST,
    type ReportRange,
    type TrafficChannel,
    type TrafficLanding,
    type TrafficReport,
} from './traffic-report';
import { visitBatches } from './visits-store';

export async function readTrafficReport(range: ReportRange): Promise<TrafficReport> {
    const from = new Date(`${range.from}T00:00:00+09:00`).toISOString();
    const to = new Date(Date.parse(`${range.to}T00:00:00+09:00`) + 86400000).toISOString();
    const linked = new Set<string>();
    let warning = '';
    if (sheetsReady) {
        try {
            for (const row of await readLeadRows()) {
                const lead = rowToLead(row);
                if (lead.visitSessionId) linked.add(lead.visitSessionId);
            }
        } catch {
            warning = '문의 시트 조회에 실패해 방문 기록에 저장된 문의 연결만 집계했습니다.';
        }
    } else warning = '문의 시트가 연결되지 않아 방문 기록에 저장된 문의 연결만 집계했습니다.';

    const visitors = new Set<string>();
    const todayVisitors = new Set<string>();
    const channels = new Map<string, TrafficChannel>();
    const landings = new Map<string, TrafficLanding>();
    const aiLandings = new Map<string, TrafficLanding>();
    const daily = new Map<string, TrafficReport['daily'][number]>();
    for (let at = Date.parse(from); at < Date.parse(to); at += 86400000) {
        const date = dayKST(at);
        daily.set(date, { date, visits: 0, aiVisits: 0, convertedVisits: 0 });
    }
    const report: TrafficReport = {
        ...range,
        generatedAt: '',
        latestVisitAt: '',
        warning,
        visits: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        convertedVisits: 0,
        aiVisits: 0,
        aiConvertedVisits: 0,
        unknownVisits: 0,
        todayVisits: 0,
        todayUnique: 0,
        daily: [],
        channels: [],
        platforms: [],
        landings: [],
        aiLandings: [],
        recentAi: [],
    };
    const today = dayKST();
    for await (const batch of visitBatches(from, to)) {
        for (const visit of batch) {
            const { source, medium, evidence } = visitAttribution(visit);
            const label = trafficLabel(source, medium);
            const converted = Boolean(linked.has(visit.id) || visit.inquiryAt || visit.hospital);
            const ai = medium === 'ai';
            const date = dayKST(Date.parse(visit.startedAt));
            report.visits++;
            report.pageViews += visit.pageCount;
            if (visit.visitorId) visitors.add(visit.visitorId);
            if (converted) report.convertedVisits++;
            if (ai) report.aiVisits++;
            if (ai && converted) report.aiConvertedVisits++;
            if (!source || source === 'direct') report.unknownVisits++;
            if (date === today) {
                report.todayVisits++;
                if (visit.visitorId) todayVisitors.add(visit.visitorId);
            }
            if (visit.lastAt > report.latestVisitAt) report.latestVisitAt = visit.lastAt;
            const cell = daily.get(date);
            if (cell) {
                cell.visits++;
                if (ai) cell.aiVisits++;
                if (converted) cell.convertedVisits++;
            }
            const key = `${source}:${medium}`;
            const channel = channels.get(key) || { source, medium, label, visits: 0, convertedVisits: 0 };
            channel.visits++;
            if (converted) channel.convertedVisits++;
            channels.set(key, channel);
            const addLanding = (map: Map<string, TrafficLanding>, bySource: boolean) => {
                if (!visit.landingUrl) return;
                const key = `${bySource ? source : ''}:${visit.landingUrl}`;
                const item = map.get(key) || {
                    url: visit.landingUrl,
                    title: visit.landingTitle,
                    source,
                    label,
                    visits: 0,
                    convertedVisits: 0,
                };
                item.visits++;
                if (converted) item.convertedVisits++;
                map.set(key, item);
            };
            addLanding(landings, false);
            if (ai) {
                addLanding(aiLandings, true);
                if (report.recentAi.length < 20)
                    report.recentAi.push({
                        id: visit.id,
                        at: visit.startedAt,
                        label,
                        evidence,
                        url: visit.landingUrl,
                        title: visit.landingTitle,
                        converted,
                    });
            }
        }
    }
    const byVisits = <T extends { visits: number }>(items: T[]) => items.sort((a, b) => b.visits - a.visits);
    report.generatedAt = new Date().toISOString();
    report.uniqueVisitors = visitors.size;
    report.todayUnique = todayVisitors.size;
    report.daily = [...daily.values()];
    report.channels = byVisits([...channels.values()]);
    report.platforms = report.channels.filter((item) => item.medium === 'ai');
    for (const source of ['chatgpt', 'claude', 'gemini', 'perplexity']) {
        if (!report.platforms.some((item) => item.source === source))
            report.platforms.push({
                source,
                medium: 'ai',
                label: trafficLabel(source, 'ai'),
                visits: 0,
                convertedVisits: 0,
            });
    }
    report.landings = byVisits([...landings.values()]).slice(0, 10);
    report.aiLandings = byVisits([...aiLandings.values()]).slice(0, 20);
    return report;
}
