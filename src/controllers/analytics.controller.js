const analyticsService = require('../services/analytics.service');

class AnalyticsController {
    async getAll(req, res, next) {
        try {
            const data = await analyticsService.getAll();
            res.status(200).json(data);
        } catch (err) {
            // Return structured empty state so the dashboard doesn't crash
            if (err.statusCode === 503 || err.code === 7) {
                return res.status(503).json({
                    error: 'GA4 не налаштовано',
                    hint: 'Додайте GA4_PROPERTY_ID та GA4_CREDENTIALS до змінних середовища',
                });
            }
            next(err);
        }
    }
}

module.exports = new AnalyticsController();
