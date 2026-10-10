export type ReportRange = { from: string; to: string };
export const dayKST = (at = Date.now()) => new Date(at + 9 * 3600000).toISOString().slice(0, 10);
export const recentRange = (days = 7): ReportRange => ({
    from: dayKST(Date.now() - (days - 1) * 86400000),
    to: dayKST(),
});

export function validReportRange(from: string | null, to: string | null): from is string {
    const valid = (value: string | null) => {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const at = Date.parse(`${value}T00:00:00Z`);
        return Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === value;
    };
    if (!valid(from) || !valid(to)) return false;
    const days = (Date.parse(to!) - Date.parse(from!)) / 86400000;
    return days >= 0 && days < 90 && to! <= dayKST();
}

export type TrafficCount = {
    visits: number;
    convertedVisits: number;
};
export type TrafficChannel = TrafficCount & { source: string; medium: string; label: string };
export type TrafficLanding = TrafficCount & { url: string; title: string; source: string; label: string };
export type TrafficReport = ReportRange & {
    generatedAt: string;
    latestVisitAt: string;
    warning: string;
    visits: number;
    uniqueVisitors: number;
    pageViews: number;
    convertedVisits: number;
    aiVisits: number;
    aiConvertedVisits: number;
    unknownVisits: number;
    todayVisits: number;
    todayUnique: number;
    daily: (TrafficCount & { date: string; aiVisits: number })[];
    channels: TrafficChannel[];
    platforms: TrafficChannel[];
    landings: TrafficLanding[];
    aiLandings: TrafficLanding[];
    recentAi: {
        id: string;
        at: string;
        label: string;
        evidence: string;
        url: string;
        title: string;
        converted: boolean;
    }[];
};
export type TrafficReportPayload = { ready: boolean; report?: TrafficReport; message?: string };
