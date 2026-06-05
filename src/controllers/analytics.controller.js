const analyticsService = require('../services/analytics.service');

// gRPC error codes from @grpc/grpc-js
const GRPC_UNAUTHENTICATED  = 16;
const GRPC_PERMISSION_DENIED = 7;
const GRPC_NOT_FOUND        = 5;

const gaErrorHint = (err) => {
    if (err.statusCode === 503) return err.message;
    if (err.code === GRPC_UNAUTHENTICATED)   return 'Сервісний акаунт не автентифікований. Перевірте GA4_CREDENTIALS.';
    if (err.code === GRPC_PERMISSION_DENIED)  return 'Доступ заборонено. Додайте сервісний акаунт до GA4 → Property Access Management.';
    if (err.code === GRPC_NOT_FOUND)          return `Property ID ${process.env.GA4_PROPERTY_ID} не знайдено. Перевірте GA4_PROPERTY_ID.`;
    return `GA4 помилка: ${err.message}`;
};

class AnalyticsController {
    async getAll(req, res, next) {
        try {
            const data = await analyticsService.getAll();
            res.status(200).json(data);
        } catch (err) {
            const isGA4Error = err.statusCode === 503
                || [GRPC_UNAUTHENTICATED, GRPC_PERMISSION_DENIED, GRPC_NOT_FOUND].includes(err.code);

            if (isGA4Error) {
                return res.status(503).json({ hint: gaErrorHint(err) });
            }
            next(err);
        }
    }
}

module.exports = new AnalyticsController();
