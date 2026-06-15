import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Skill from '../models/Skill.js';
import User from '../models/User.js';

const toId = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const getPreview = (message) => {
  if (!message) return '';
  return message.text || (message.attachmentUrl ? 'Attachment shared' : '');
};

const isReadMessage = (message) => Boolean(message.isRead || message.readAt);

const getParticipantKey = (userA, userB) => [toId(userA), toId(userB)].sort().join(':');

const populateMessage = (query) =>
  query
    .populate('sender', 'name email profilePic avatarUrl')
    .populate('receiver', 'name email profilePic avatarUrl');

const getOrCreateConversation = async (userId, peerId) => {
  const participantKey = getParticipantKey(userId, peerId);
  const now = new Date();

  return Conversation.findOneAndUpdate(
    { participantKey },
    {
      $setOnInsert: {
        participants: [userId, peerId],
        participantKey,
        lastMessage: '',
        lastMessageAt: now,
        unreadCounts: [
          { user: userId, count: 0 },
          { user: peerId, count: 0 },
        ],
      },
    },
    { new: true, upsert: true }
  ).populate('participants', 'name email profilePic avatarUrl bio institution');
};

const getConversationUnreadCount = (conversation, userId) => {
  const match = conversation.unreadCounts?.find((item) => toId(item.user) === userId);
  return match?.count || 0;
};

const serializeConversation = (conversation, userId, fallbackUnreadCount = 0) => {
  const peer = conversation.participants?.find((participant) => toId(participant) !== userId);
  const unreadCount = getConversationUnreadCount(conversation, userId) || fallbackUnreadCount;

  return {
    _id: conversation._id,
    peer: peer || { _id: '', name: 'Peer' },
    lastMessage: conversation.lastMessage || 'No messages yet',
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    unreadCount,
    hasUnread: unreadCount > 0,
    isRead: unreadCount === 0,
  };
};

const updateConversationAfterMessage = async (senderId, receiverId, preview, sentAt) => {
  const conversation = await getOrCreateConversation(senderId, receiverId);

  conversation.lastMessage = preview;
  conversation.lastMessageAt = sentAt;
  const knownUsers = new Set(conversation.unreadCounts.map((item) => toId(item.user)));
  if (!knownUsers.has(senderId)) {
    conversation.unreadCounts.push({ user: senderId, count: 0 });
  }
  if (!knownUsers.has(receiverId)) {
    conversation.unreadCounts.push({ user: receiverId, count: 0 });
  }
  conversation.unreadCounts = conversation.unreadCounts.map((item) => (
    toId(item.user) === receiverId ? { user: item.user, count: (item.count || 0) + 1 } : item
  ));

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
      },
    }
  );
  return conversation;
};

const resetConversationUnread = async (userId, peerId) => {
  const conversation = await Conversation.findOne({ participantKey: getParticipantKey(userId, peerId) });
  if (!conversation) return null;

  conversation.unreadCounts = conversation.unreadCounts.map((item) => (
    toId(item.user) === userId ? { user: item.user, count: 0 } : item
  ));

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: { unreadCounts: conversation.unreadCounts },
    }
  );
  return conversation;
};

export const listMessages = async (req, res, next) => {
  try {
    const { otherUserId } = req.query;

    if (!otherUserId) {
      return res.json({ messages: [] });
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid conversation user ID' });
    }

    const filter = {
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id },
      ],
    };

    const messages = await populateMessage(Message.find(filter).sort({ createdAt: 1 }));

    return res.json({
      messages: messages.map((message) => ({
        ...message.toObject(),
        isRead: isReadMessage(message),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [messages, persistedConversations] = await Promise.all([
      Message.find({
        $or: [{ sender: userId }, { receiver: userId }],
      })
        .sort({ createdAt: -1 })
        .lean(),
      Conversation.find({ participants: userObjectId })
        .populate('participants', 'name email profilePic avatarUrl bio institution')
        .sort({ lastMessageAt: -1 }),
    ]);

    const conversationsByPeer = new Map();

    persistedConversations.forEach((conversation) => {
      const peer = conversation.participants.find((participant) => toId(participant) !== userId);
      const peerId = toId(peer);
      if (!peerId) return;
      const serialized = serializeConversation(conversation, userId);
      serialized.unreadCount = 0;
      serialized.hasUnread = false;
      serialized.isRead = true;
      conversationsByPeer.set(peerId, serialized);
    });

    messages.forEach((message) => {
      const senderId = toId(message.sender);
      const receiverId = toId(message.receiver);
      const peerId = senderId === userId ? receiverId : senderId;
      if (!peerId) return;

      const existing = conversationsByPeer.get(peerId);
      const isUnreadIncoming = receiverId === userId && !isReadMessage(message);

      if (!existing) {
        conversationsByPeer.set(peerId, {
          peerId,
          lastMessage: getPreview(message),
          lastMessageAt: message.createdAt,
          unreadCount: isUnreadIncoming ? 1 : 0,
          hasUnread: isUnreadIncoming,
          isRead: !isUnreadIncoming,
        });
        return;
      }

      if (!existing.lastMessageAt || new Date(message.createdAt) > new Date(existing.lastMessageAt)) {
        existing.lastMessage = getPreview(message);
        existing.lastMessageAt = message.createdAt;
      }

      if (isUnreadIncoming) {
        existing.unreadCount += 1;
        existing.hasUnread = true;
        existing.isRead = false;
      }
    });

    const missingPeerIds = [...conversationsByPeer.values()]
      .filter((conversation) => !conversation.peer && conversation.peerId)
      .map((conversation) => conversation.peerId);
    const peers = await User.find({ _id: { $in: missingPeerIds } })
      .select('name email profilePic avatarUrl bio institution')
      .lean();
    const peersById = new Map(peers.map((peer) => [toId(peer._id), peer]));

    const conversations = [...conversationsByPeer.values()]
      .map((conversation) => ({
        ...conversation,
        peer: conversation.peer || peersById.get(conversation.peerId) || { _id: conversation.peerId, name: 'Peer' },
      }))
      .sort((a, b) => {
        if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1;
        return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
      });

    return res.json({
      conversations,
      totalUnread: conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    });
  } catch (error) {
    return next(error);
  }
};

export const searchChatUsers = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();

    if (q.length < 2) {
      return res.json({ users: [] });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');

    const skillMatches = await Skill.find({
      $or: [
        { skillName: pattern },
        { category: pattern },
        { wantsToLearn: pattern },
      ],
    }).select('user');

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: pattern },
        { email: pattern },
        { _id: { $in: skillMatches.map((skill) => skill.user) } },
      ],
    })
      .select('name email profilePic avatarUrl bio institution')
      .limit(12)
      .lean();

    const skills = await Skill.find({ user: { $in: users.map((user) => user._id) } })
      .select('user skillName category level')
      .sort({ createdAt: -1 })
      .lean();

    const skillsByUser = skills.reduce((map, skill) => {
      const key = toId(skill.user);
      if (!map.has(key)) map.set(key, []);
      if (map.get(key).length < 4) map.get(key).push(skill);
      return map;
    }, new Map());

    return res.json({
      users: users.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        institution: user.institution,
        skills: skillsByUser.get(toId(user._id)) || [],
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const startConversation = async (req, res, next) => {
  try {
    const peerId = req.body.peerId || req.body.userId;

    if (!peerId || !mongoose.Types.ObjectId.isValid(peerId)) {
      return res.status(400).json({ message: 'Valid user is required to start a chat' });
    }

    if (peerId === req.user.id) {
      return res.status(400).json({ message: 'You cannot start a chat with yourself' });
    }

    const peerExists = await User.exists({ _id: peerId });
    if (!peerExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const conversation = await getOrCreateConversation(req.user.id, peerId);
    return res.status(201).json({ conversation: serializeConversation(conversation, req.user.id) });
  } catch (error) {
    return next(error);
  }
};

export const getUnreadCounts = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id });

    return res.json({
      counts: conversations
        .map((conversation) => ({
          peerId: conversation.participants.find((participant) => toId(participant) !== req.user.id)?.toString(),
          unreadCount: getConversationUnreadCount(conversation, req.user.id),
          lastMessageAt: conversation.lastMessageAt,
        }))
        .filter((item) => item.peerId),
      totalUnread: conversations.reduce(
        (total, conversation) => total + getConversationUnreadCount(conversation, req.user.id),
        0
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiver, exchange = null, text = '', attachmentUrl = '' } = req.body;

    if (!receiver) {
      return res.status(400).json({ message: 'Receiver is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    if (!text.trim() && !attachmentUrl.trim()) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver,
      exchange: exchange || undefined,
      text,
      attachmentUrl,
      isRead: false,
      readAt: null,
    });

    const populatedMessage = await populateMessage(Message.findById(message._id));
    await updateConversationAfterMessage(req.user.id, receiver, getPreview(message), message.createdAt);

    return res.status(201).json({
      message: {
        ...populatedMessage.toObject(),
        isRead: false,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const markMessageRead = async (req, res, next) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, receiver: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await resetConversationUnread(req.user.id, toId(message.sender));
    return res.json({ message });
  } catch (error) {
    return next(error);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid conversation user ID' });
    }

    const result = await Message.updateMany(
      {
        sender: otherUserId,
        receiver: req.user.id,
        $or: [{ isRead: false }, { readAt: null }],
      },
      { isRead: true, readAt: new Date() }
    );
    await resetConversationUnread(req.user.id, otherUserId);

    return res.json({ markedRead: result.modifiedCount || 0 });
  } catch (error) {
    return next(error);
  }
};
