const Review = require('../models/review.model');

class ReviewController {
    // Public: approved only, paginated
    async getPublic(req, res, next) {
        try {
            const page  = Math.max(1, parseInt(req.query.page)  || 1);
            const limit = Math.min(50, parseInt(req.query.limit) || 9);
            const skip  = (page - 1) * limit;

            const [reviews, total, avgResult] = await Promise.all([
                Review.find({ status: 'approved' }).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
                Review.countDocuments({ status: 'approved' }),
                Review.aggregate([
                    { $match: { status: 'approved' } },
                    { $group: { _id: null, avg: { $avg: '$rating' } } },
                ]),
            ]);

            res.json({
                data:      reviews,
                total,
                page,
                hasMore:   skip + reviews.length < total,
                avgRating: avgResult[0] ? Math.round(avgResult[0].avg * 10) / 10 : 5,
            });
        } catch (e) { next(e); }
    }

    // Admin: all reviews with optional status filter
    async getAll(req, res, next) {
        try {
            const filter = req.query.status ? { status: req.query.status } : {};
            const reviews = await Review.find(filter).sort({ createdAt: -1 });
            res.json(reviews);
        } catch (e) { next(e); }
    }

    async create(req, res, next) {
        try {
            const review = await Review.create(req.body);
            res.status(201).json(review);
        } catch (e) { next(e); }
    }

    async update(req, res, next) {
        try {
            const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            if (!review) return res.status(404).json({ message: 'Відгук не знайдено' });
            res.json(review);
        } catch (e) { next(e); }
    }

    async remove(req, res, next) {
        try {
            const review = await Review.findByIdAndDelete(req.params.id);
            if (!review) return res.status(404).json({ message: 'Відгук не знайдено' });
            res.json({ message: 'Видалено' });
        } catch (e) { next(e); }
    }
}

module.exports = new ReviewController();
