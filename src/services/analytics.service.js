const { BetaAnalyticsDataClient } = require('@google-analytics/data');

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
            limit: 7,
        });
        return (res.rows || []).map(row => ({
            path:   row.dimensionValues[0].value,
            title:  row.dimensionValues[1].value,
            views:  parseInt(row.metricValues[0].value),
        }));
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
