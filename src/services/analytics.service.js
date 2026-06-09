const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const Test = require('../models/test.model');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const buildClient = () => {
    const raw = process.env.GA4_CREDENTIALS;
    if (!raw) return new BetaAnalyticsDataClient();

    let creds;
    try {
        creds = JSON.parse(raw);
    } catch {
        // Render sometimes double-escapes the JSON — try to fix it
        try {
            creds = JSON.parse(raw.replace(/\\n/g, '\n'));
        } catch {
            throw Object.assign(new Error('GA4_CREDENTIALS не є валідним JSON'), { statusCode: 503 });
        }
    }

    // Ensure private_key newlines are real newlines, not literal \n strings
    if (creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }

    return new BetaAnalyticsDataClient({ credentials: creds });
};

// Map path patterns to friendly Ukrainian page names.
// If the GA4 pageTitle is unique (not just the site name), we keep it.
// Otherwise we derive a meaningful label from the URL structure.
const SITE_NAME_RE = /онлайн центр|mental|ментального здоров|євгена скрипника/i;

const PATH_RULES = [
    { re: /^\/$/, label: 'Головна сторінка' },
    { re: /^\/test\/list/,           label: 'Список тестів' },
    { re: /^\/test\/detail\//,       label: 'Тест · деталі' },
    { re: /^\/test\//,               label: 'Тест' },
    { re: /^\/article\/list/,        label: 'Список статей' },
    { re: /^\/article\//,            label: 'Стаття' },
    { re: /^\/articles/,             label: 'Статті' },
    { re: /^\/team/,                 label: 'Команда' },
    { re: /^\/specialists/,          label: 'Спеціалісти' },
    { re: /^\/doctors/,              label: 'Лікарі' },
    { re: /^\/about/,                label: 'Про нас' },
    { re: /^\/contact/,              label: 'Контакти' },
    { re: /^\/reviews/,              label: 'Відгуки' },
    { re: /^\/blog/,                 label: 'Блог' },
    { re: /^\/services/,             label: 'Послуги' },
    { re: /^\/faq/,                  label: 'Питання та відповіді' },
    { re: /^\/login/,                label: 'Вхід' },
    { re: /^\/register/,             label: 'Реєстрація' },
    { re: /^\/profile/,              label: 'Профіль' },
    { re: /^\/search/,               label: 'Пошук' },
    { re: /^\/privacy/,              label: 'Конфіденційність' },
    { re: /^\/terms/,                label: 'Умови використання' },
];

function friendlyTitle(path, gaTitle) {
    // If GA4 already returned a unique, meaningful title — use it
    if (gaTitle && gaTitle.trim() && !SITE_NAME_RE.test(gaTitle)) {
        // Truncate very long titles
        return gaTitle.length > 60 ? gaTitle.slice(0, 57) + '…' : gaTitle;
    }

    // Otherwise derive label from the path
    for (const rule of PATH_RULES) {
        if (rule.re.test(path)) return rule.label;
    }

    // Generic fallback: clean up the path into a readable label
    const segments = path.replace(/\/$/, '').split('/').filter(Boolean);
    if (!segments.length) return 'Головна сторінка';

    // If last segment looks like a MongoDB ObjectId or UUID, use the previous one
    const last = segments[segments.length - 1];
    const isId = /^[a-f\d]{20,}$/i.test(last) || /^[\w-]{30,}$/.test(last);
    const label = isId && segments.length > 1 ? segments[segments.length - 2] : last;

    // Capitalise and replace hyphens/underscores with spaces
    return label.replace(/[-_]/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

class AnalyticsService {
    get propertyId() {
        if (!process.env.GA4_PROPERTY_ID) throw makeError('GA4_PROPERTY_ID not set', 503);
        return `properties/${process.env.GA4_PROPERTY_ID}`;
    }

    get client() {
        if (!this._client) this._client = buildClient();
        return this._client;
    }

    async getSummary() {
        const [res] = await this.client.runReport({
            property: this.propertyId,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
                { name: 'screenPageViews' },
                { name: 'bounceRate' },
                { name: 'averageSessionDuration' },
                { name: 'newUsers' },
            ],
        });
        const v = (i) => res.rows?.[0]?.metricValues?.[i]?.value ?? '0';
        return {
            sessions:    parseInt(v(0)),
            users:       parseInt(v(1)),
            pageViews:   parseInt(v(2)),
            bounceRate:  (parseFloat(v(3)) * 100).toFixed(1),
            avgDuration: Math.round(parseFloat(v(4))),
            newUsers:    parseInt(v(5)),
        };
    }

    async getDailyStats() {
        const [res] = await this.client.runReport({
            property: this.propertyId,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
        });
        return (res.rows || []).map(row => ({
            date:     row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value),
            users:    parseInt(row.metricValues[1].value),
        }));
    }

    async getTopPages() {
        const [res] = await this.client.runReport({
            property: this.propertyId,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 10,
        });

        const rows = res.rows || [];

        // Collect unique test IDs from /test/detail/:id paths
        const TEST_DETAIL_RE = /^\/test\/detail\/([a-f\d]{24})$/i;
        const testIds = [...new Set(
            rows
                .map(r => r.dimensionValues[0].value)
                .map(p => TEST_DETAIL_RE.exec(p)?.[1])
                .filter(Boolean)
        )];

        // Bulk-fetch test names in one query
        const testMap = {};
        if (testIds.length) {
            const tests = await Test.find({ _id: { $in: testIds } }, 'name').lean();
            tests.forEach(t => { testMap[t._id.toString()] = t.name; });
        }

        return rows.map(row => {
            const path  = row.dimensionValues[0].value;
            const gaTitle = row.dimensionValues[1].value;
            const match = TEST_DETAIL_RE.exec(path);
            const title = match && testMap[match[1]]
                ? testMap[match[1]]
                : friendlyTitle(path, gaTitle);
            return { path, title, views: parseInt(row.metricValues[0].value) };
        });
    }

    async getTrafficSources() {
        const [res] = await this.client.runReport({
            property: this.propertyId,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        });
        return (res.rows || []).map(row => ({
            source:   row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value),
        }));
    }

    async getDevices() {
        const [res] = await this.client.runReport({
            property: this.propertyId,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        });
        return (res.rows || []).map(row => ({
            device:   row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value),
        }));
    }

    async getAll() {
        const [summary, daily, topPages, sources, devices] = await Promise.all([
            this.getSummary(),
            this.getDailyStats(),
            this.getTopPages(),
            this.getTrafficSources(),
            this.getDevices(),
        ]);
        return { summary, daily, topPages, sources, devices };
    }
}

module.exports = new AnalyticsService();
