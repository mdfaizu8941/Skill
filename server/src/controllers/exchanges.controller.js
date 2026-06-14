import mongoose from 'mongoose';
import Exchange from '../models/Exchange.js';
import User from '../models/User.js';

const allowedStatuses = ['pending', 'accepted', 'rejected'];
const decisionStatuses = ['accepted', 'rejected'];

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const toId = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const serializeExchange = (exchange) => {
  const data = exchange.toObject({ virtuals: true });
  return {
    ...data,
    senderId: toId(data.sender),
    receiverId: toId(data.receiver),
    status: normalizeStatus(data.status),
  };
};

const populateExchangeQuery = (query) =>
  query
    .populate('sender', 'name email profilePic')
    .populate('receiver', 'name email profilePic');

const populateExchangeDocument = async (exchange) => {
  await exchange.populate('sender', 'name email profilePic');
  await exchange.populate('receiver', 'name email profilePic');
  return exchange;
};

export const listExchanges = async (req, res, next) => {
  try {
    const exchanges = await populateExchangeQuery(Exchange.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    }).sort({ createdAt: -1 }));

    return res.json({ exchanges: exchanges.map(serializeExchange) });
  } catch (error) {
    return next(error);
  }
};

export const createExchange = async (req, res, next) => {
  try {
    const { receiver, receiverId, skillOffered, skillWanted, note = '' } = req.body;
    const targetReceiverId = receiverId || receiver;

    if (!targetReceiverId || !skillOffered || !skillWanted) {
      return res.status(400).json({ message: 'Receiver, skill offered, and skill wanted are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetReceiverId)) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    if (targetReceiverId === req.user.id) {
      return res.status(400).json({ message: 'You cannot send an exchange request to yourself' });
    }

    const receiverExists = await User.exists({ _id: targetReceiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const exchange = await Exchange.create({
      sender: req.user.id,
      receiver: targetReceiverId,
      skillOffered,
      skillWanted,
      note,
      status: 'pending',
    });

    await populateExchangeDocument(exchange);

    return res.status(201).json({ exchange: serializeExchange(exchange) });
  } catch (error) {
    return next(error);
  }
};

export const updateExchangeStatus = async (req, res, next) => {
  try {
    const status = normalizeStatus(req.body.status);

    console.log('[exchange:update-status] request', {
      exchangeId: req.params.id,
      userId: req.user.id,
      payload: req.body,
      normalizedStatus: status,
    });

    if (!allowedStatuses.includes(status)) {
      console.error('[exchange:update-status] validation error', {
        receivedStatus: req.body.status,
        normalizedStatus: status,
        allowedStatuses,
      });
      return res.status(400).json({ message: 'Invalid exchange status', allowedStatuses });
    }

    if (!decisionStatuses.includes(status)) {
      console.error('[exchange:update-status] invalid transition', {
        receivedStatus: status,
        allowedTransitions: decisionStatuses,
      });
      return res.status(400).json({ message: 'Pending is only valid when creating an exchange request' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('[exchange:update-status] invalid exchange id', { exchangeId: req.params.id });
      return res.status(400).json({ message: 'Invalid exchange ID' });
    }

    const exchange = await Exchange.findById(req.params.id);

    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found' });
    }

    const senderId = exchange.sender.toString();
    const receiverId = exchange.receiver.toString();

    if (senderId === req.user.id) {
      console.error('[exchange:update-status] forbidden sender update', {
        exchangeId: exchange._id.toString(),
        senderId,
        receiverId,
        userId: req.user.id,
      });
      return res.status(403).json({ message: 'Only the receiver can accept or reject this exchange request' });
    }

    if (receiverId !== req.user.id) {
      console.error('[exchange:update-status] forbidden non-participant update', {
        exchangeId: exchange._id.toString(),
        senderId,
        receiverId,
        userId: req.user.id,
      });
      return res.status(403).json({ message: 'You are not authorized to update this exchange request' });
    }

    if (normalizeStatus(exchange.status) !== 'pending') {
      console.error('[exchange:update-status] non-pending exchange update blocked', {
        exchangeId: exchange._id.toString(),
        currentStatus: exchange.status,
        requestedStatus: status,
      });
      return res.status(409).json({ message: 'Only pending exchange requests can be updated' });
    }

    exchange.status = status;
    await exchange.save();
    await populateExchangeDocument(exchange);

    const response = { exchange: serializeExchange(exchange) };
    console.log('[exchange:update-status] response', {
      exchangeId: response.exchange._id,
      status: response.exchange.status,
      senderId: response.exchange.senderId,
      receiverId: response.exchange.receiverId,
    });

    return res.json(response);
  } catch (error) {
    console.error('[exchange:update-status] unexpected error', error);
    return next(error);
  }
};
