import mongoose from 'mongoose';
import Exchange from '../models/Exchange.js';
import Rating from '../models/Rating.js';

const rateableStatuses = ['accepted', 'completed'];

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const toId = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const isExchangeParticipant = (exchange, userId) =>
  toId(exchange.sender) === userId || toId(exchange.receiver) === userId;

const getRevieweeId = (exchange, reviewerId) => {
  const senderId = toId(exchange.sender);
  const receiverId = toId(exchange.receiver);
  return senderId === reviewerId ? receiverId : senderId;
};

const populateRating = (query) =>
  query
    .populate('reviewer', 'name email profilePic')
    .populate('reviewee', 'name email profilePic')
    .populate('exchange', 'skillOffered skillWanted status sender receiver');

const populateExchangeUsers = (query) =>
  query
    .populate('sender', 'name email profilePic')
    .populate('receiver', 'name email profilePic');

export const listRatings = async (req, res, next) => {
  try {
    const ratings = await populateRating(
      Rating.find({
        $or: [{ reviewer: req.user.id }, { reviewee: req.user.id }],
      }).sort({ createdAt: -1 })
    );

    return res.json({ ratings });
  } catch (error) {
    return next(error);
  }
};

export const listRateableExchanges = async (req, res, next) => {
  try {
    const statusVariants = ['accepted', 'Accepted', 'completed', 'Completed'];
    const exchanges = await populateExchangeUsers(
      Exchange.find({
        status: { $in: statusVariants },
        $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      }).sort({ updatedAt: -1, createdAt: -1 })
    );

    const exchangeIds = exchanges.map((exchange) => exchange._id);
    const existingRatings = await Rating.find({
      exchange: { $in: exchangeIds },
      reviewer: req.user.id,
    }).select('exchange');

    const ratedExchangeIds = new Set(existingRatings.map((rating) => rating.exchange.toString()));

    return res.json({
      exchanges: exchanges.map((exchange) => {
        const peer = toId(exchange.sender) === req.user.id ? exchange.receiver : exchange.sender;
        return {
          ...exchange.toObject({ virtuals: true }),
          peer,
          alreadyRated: ratedExchangeIds.has(exchange._id.toString()),
        };
      }),
    });
  } catch (error) {
    return next(error);
  }
};

export const createRating = async (req, res, next) => {
  try {
    const exchangeId = req.body.exchangeId || req.body.exchange;
    const stars = Number(req.body.stars);
    const feedback = req.body.feedback || '';

    if (!exchangeId || !stars) {
      return res.status(400).json({ message: 'Exchange and stars are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(exchangeId)) {
      return res.status(400).json({ message: 'Invalid exchange ID' });
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Stars must be a number from 1 to 5' });
    }

    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found' });
    }

    if (!isExchangeParticipant(exchange, req.user.id)) {
      return res.status(403).json({ message: 'You can only rate users from your own exchanges' });
    }

    if (!rateableStatuses.includes(normalizeStatus(exchange.status))) {
      return res.status(400).json({ message: 'Only accepted exchanges can be rated' });
    }

    const reviewee = getRevieweeId(exchange, req.user.id);
    if (!reviewee || reviewee === req.user.id) {
      return res.status(400).json({ message: 'Unable to determine the user to rate for this exchange' });
    }

    const existingRating = await Rating.findOne({
      exchange: exchangeId,
      reviewer: req.user.id,
    });

    if (existingRating) {
      return res.status(409).json({ message: 'You have already rated this exchange' });
    }

    const rating = await Rating.create({
      exchange: exchangeId,
      reviewer: req.user.id,
      reviewee,
      stars,
      feedback,
    });

    const populatedRating = await populateRating(Rating.findById(rating._id));
    return res.status(201).json({ rating: populatedRating });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'You have already rated this exchange' });
    }

    return next(error);
  }
};
