const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const mongoose = require('mongoose');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/our-story';
const CONVERSATION_ID = 'main';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const ChatMessageSchema = new mongoose.Schema({
  conversationId: { type: String, default: 'main' },
  sender: { type: String, required: true },
  content: { type: String, default: '' },
  type: { type: String, default: 'text' },
  replyTo: { type: String },
  reactions: [{ sender: String, emoji: String }],
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: String }],
  seen: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  favorited: { type: Boolean, default: false },
  attachments: [{ url: String, type: String, name: String, size: Number, duration: Number, thumbnail: String }],
}, { timestamps: true });

let ChatMessage;

async function ensureDB() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log('[DB] Connected to MongoDB');
    }
    if (!ChatMessage) {
      ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
    }
    return true;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    return false;
  }
}

app.prepare().then(async () => {
  await ensureDB();

  const httpServer = createServer(async (req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        socketio: true,
        mongo: mongoose.connection.readyState === 1,
        uptime: process.uptime(),
      }));
      return;
    }
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: '/api/socketio',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000,
    allowUpgrades: true,
    perMessageDeflate: false,
    httpCompression: false,
  });

  const connectedUsers = new Map();
  const typingTimers = new Map();

  function getPartnerSocketId(mySender) {
    for (const [sid, data] of connectedUsers) {
      if (data.sender !== mySender) return sid;
    }
    return null;
  }

  function broadcastOnlineStatus(cid) {
    const senders = [];
    for (const [, data] of connectedUsers) {
      if (data.conversationId === cid && !senders.includes(data.sender)) {
        senders.push(data.sender);
      }
    }
    for (const [sid, data] of connectedUsers) {
      if (data.conversationId === cid) {
        io.to(sid).emit('onlineUsers', { senders });
      }
    }
  }

  io.on('connection', async (socket) => {
    console.log('[Socket] Connected:', socket.id);

    await ensureDB();

    socket.on('joinConversation', ({ conversationId, sender }) => {
      const cid = conversationId || CONVERSATION_ID;
      socket.join(cid);
      connectedUsers.set(socket.id, { sender: sender || 'me', conversationId: cid });
      console.log(`[Socket] ${sender} joined ${cid} (${connectedUsers.size} total)`);

      broadcastOnlineStatus(cid);
    });

    socket.on('leaveConversation', ({ conversationId }) => {
      const cid = conversationId || CONVERSATION_ID;
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        socket.to(cid).emit('userOffline', {
          sender: userData.sender,
          lastSeen: new Date().toISOString(),
        });
        socket.leave(cid);
        connectedUsers.delete(socket.id);
        broadcastOnlineStatus(cid);
      }
    });

    socket.on('sendMessage', async (data) => {
      try {
        if (!ChatMessage) await ensureDB();
        if (!ChatMessage) {
          socket.emit('messageError', { error: 'Database not available' });
          return;
        }

        const message = await ChatMessage.create({
          conversationId: data.conversationId || CONVERSATION_ID,
          sender: data.sender,
          content: data.content || '',
          type: data.type || 'text',
          replyTo: data.replyTo,
          attachments: data.attachments || [],
        });

        const msgObj = message.toObject();
        msgObj._id = msgObj._id.toString();

        const cid = data.conversationId || CONVERSATION_ID;
        for (const [sid, userData] of connectedUsers) {
          if (sid !== socket.id && userData.conversationId === cid) {
            io.to(sid).emit('receiveMessage', msgObj);
          }
        }

        socket.emit('messageSaved', {
          tempId: data.tempId,
          _id: msgObj._id,
          createdAt: msgObj.createdAt,
          updatedAt: msgObj.updatedAt,
        });

        console.log(`[Socket] Message saved: ${msgObj._id} from ${data.sender}`);
      } catch (err) {
        console.error('[Socket] Save error:', err.message);
        socket.emit('messageError', { error: 'Failed to save message' });
      }
    });

    socket.on('typing', (data) => {
      const cid = data.conversationId || CONVERSATION_ID;
      const key = `${cid}:${data.sender}`;
      if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));

      for (const [sid, userData] of connectedUsers) {
        if (sid !== socket.id && userData.conversationId === cid) {
          io.to(sid).emit('partnerTyping', { sender: data.sender });
        }
      }

      typingTimers.set(key, setTimeout(() => {
        for (const [sid, userData] of connectedUsers) {
          if (sid !== socket.id && userData.conversationId === cid) {
            io.to(sid).emit('partnerStopTyping', { sender: data.sender });
          }
        }
        typingTimers.delete(key);
      }, 4000));
    });

    socket.on('stopTyping', (data) => {
      const cid = data.conversationId || CONVERSATION_ID;
      const key = `${cid}:${data.sender}`;
      if (typingTimers.has(key)) {
        clearTimeout(typingTimers.get(key));
        typingTimers.delete(key);
      }
      for (const [sid, userData] of connectedUsers) {
        if (sid !== socket.id && userData.conversationId === cid) {
          io.to(sid).emit('partnerStopTyping', { sender: data.sender });
        }
      }
    });

    socket.on('messageDelivered', (data) => {
      const cid = data.conversationId || CONVERSATION_ID;
      for (const [sid, userData] of connectedUsers) {
        if (sid !== socket.id && userData.conversationId === cid) {
          io.to(sid).emit('messageDelivered', { messageId: data.messageId });
        }
      }
    });

    socket.on('messageSeen', (data) => {
      const cid = data.conversationId || CONVERSATION_ID;
      for (const [sid, userData] of connectedUsers) {
        if (sid !== socket.id && userData.conversationId === cid) {
          io.to(sid).emit('messageSeen', { messageId: data.messageId });
        }
      }
    });

    socket.on('addReaction', async (data) => {
      try {
        if (!ChatMessage) return;
        const message = await ChatMessage.findById(data.messageId);
        if (!message) return;

        const idx = message.reactions.findIndex((r) => r.sender === data.sender);
        if (idx >= 0) {
          if (message.reactions[idx].emoji === data.emoji) {
            message.reactions.splice(idx, 1);
          } else {
            message.reactions[idx].emoji = data.emoji;
          }
        } else {
          message.reactions.push({ sender: data.sender, emoji: data.emoji });
        }
        await message.save();

        const cid = data.conversationId || CONVERSATION_ID;
        const msgObj = message.toObject();
        msgObj._id = msgObj._id.toString();
        for (const [sid, userData] of connectedUsers) {
          if (userData.conversationId === cid) {
            io.to(sid).emit('messageReactionUpdated', {
              messageId: data.messageId,
              reactions: msgObj.reactions,
            });
          }
        }
      } catch (err) {
        console.error('[Socket] Reaction error:', err.message);
      }
    });

    socket.on('editMessage', async (data) => {
      try {
        if (!ChatMessage) await ensureDB();
        if (!ChatMessage) return;

        const message = await ChatMessage.findByIdAndUpdate(
          data.messageId,
          { content: data.content, isEdited: true },
          { new: true }
        );
        if (message) {
          const cid = data.conversationId || CONVERSATION_ID;
          const msgObj = message.toObject();
          msgObj._id = msgObj._id.toString();
          for (const [sid, userData] of connectedUsers) {
            if (sid !== socket.id && userData.conversationId === cid) {
              io.to(sid).emit('messageUpdated', msgObj);
            }
          }
        }
      } catch (err) {
        console.error('[Socket] Edit error:', err.message);
      }
    });

    socket.on('deleteMessage', async (data) => {
      try {
        if (!ChatMessage) await ensureDB();
        if (!ChatMessage) return;

        const cid = data.conversationId || CONVERSATION_ID;
        if (data.deleteFor === 'both') {
          await ChatMessage.findByIdAndDelete(data.messageId);
        } else {
          await ChatMessage.findByIdAndUpdate(data.messageId, { $addToSet: { deletedFor: data.sender } });
        }

        for (const [sid, userData] of connectedUsers) {
          if (sid !== socket.id && userData.conversationId === cid) {
            io.to(sid).emit('messageDeleted', {
              messageId: data.messageId,
              deletedFor: data.deleteFor,
            });
          }
        }

        console.log(`[Socket] Message deleted: ${data.messageId} (${data.deleteFor})`);
      } catch (err) {
        console.error('[Socket] Delete error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        const cid = userData.conversationId;
        socket.to(cid).emit('userOffline', {
          sender: userData.sender,
          lastSeen: new Date().toISOString(),
        });
        connectedUsers.delete(socket.id);
        broadcastOnlineStatus(cid);
        console.log(`[Socket] ${userData.sender} disconnected (${connectedUsers.size} total)`);
      }
      for (const [key, timer] of typingTimers) {
        if (key.includes(socket.id)) {
          clearTimeout(timer);
          typingTimers.delete(key);
        }
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`\n> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO active on /api/socketio`);
    console.log(`> Health check at /api/health\n`);
  });
});
