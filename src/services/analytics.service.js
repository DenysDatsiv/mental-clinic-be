const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const buildClient = () => {
    const raw = process.env.GA4_CREDENTIALS;
    if (!raw) return new BetaAnalyticsDataClient();
    try {
        return new BetaAnalyticsDataClient({ credentials: JSON.parse(raw) });
    } catch {
        throw new Error('GA4_CREDENTIALS is not valid JSON');
    }
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

    async getAll() {
        const [summary, daily, topPages] = await Promise.all([
            this.getSummary(),
            this.getDailyStats(),
            this.getTopPages(),
        ]);
        return { summary, daily, topPages };
    }
}

module.exports = new AnalyticsService();
