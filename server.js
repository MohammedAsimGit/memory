const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const CONVERSATION_ID = 'main';

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: '/api/socketio',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const connectedUsers = new Map();
  const typingTimers = new Map();

  function getConnectedSockets() {
    return Array.from(connectedUsers.keys());
  }

  function getPartnerSocketId(sender) {
    for (const [socketId, data] of connectedUsers) {
      if (data.sender !== sender) return socketId;
    }
    return null;
  }

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Connected:', socket.id);

    socket.on('joinConversation', ({ conversationId, sender }) => {
      const cid = conversationId || CONVERSATION_ID;
      socket.join(cid);
      connectedUsers.set(socket.id, { sender: sender || 'me', conversationId: cid });
      console.log(`[Socket.IO] ${sender} joined ${cid} (${connectedUsers.size} online)`);

      const partnerSocketId = getPartnerSocketId(sender);
      if (partnerSocketId) {
        socket.to(cid).emit('userOnline', { sender });
        socket.emit('userOnline', { sender: connectedUsers.get(partnerSocketId)?.sender });
      }

      const onlineSenders = [];
      for (const [, data] of connectedUsers) {
        if (data.conversationId === cid && !onlineSenders.includes(data.sender)) {
          onlineSenders.push(data.sender);
        }
      }
      socket.emit('onlineUsers', { senders: onlineSenders });
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
      }
    });

    socket.on('sendMessage', async (data) => {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/our-story', {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
          });
        }

        const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', new mongoose.Schema({
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
        }, { timestamps: true }));

        const message = await ChatMessage.create({
          conversationId: data.conversationId || CONVERSATION_ID,
          sender: data.sender,
          content: data.content || '',
          type: data.type || 'text',
          replyTo: data.replyTo,
          attachments: data.attachments || [],
        });

        const messageObj = message.toObject();
        messageObj._id = messageObj._id.toString();

        const senderSid = socket.id;
        for (const [sid, userData] of connectedUsers) {
          if (sid !== senderSid && userData.conversationId === (data.conversationId || CONVERSATION_ID)) {
            io.to(sid).emit('receiveMessage', messageObj);
          }
        }

        socket.emit('messageSaved', {
          tempId: data.tempId,
          _id: messageObj._id,
          createdAt: messageObj.createdAt,
          updatedAt: messageObj.updatedAt,
        });
      } catch (err) {
        console.error('[Socket.IO] Error saving message:', err);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      const cid = data.conversationId || CONVERSATION_ID;
      const sender = data.sender;
      const key = `${cid}:${sender}`;

      if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));

      for (const [sid, userData] of connectedUsers) {
        if (sid !== socket.id && userData.conversationId === cid) {
          io.to(sid).emit('partnerTyping', { sender });
        }
      }

      typingTimers.set(key, setTimeout(() => {
        for (const [sid, userData] of connectedUsers) {
          if (sid !== socket.id && userData.conversationId === cid) {
            io.to(sid).emit('partnerStopTyping', { sender });
          }
        }
        typingTimers.delete(key);
      }, 4000));
    });

    socket.on('stopTyping', (data) => {
      const cid = data.conversationId || CONVERSATION_ID;
      const sender = data.sender;
      const key = `${cid}:${sender}`;
      if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));
      typingTimers.delete(key);

      for (const [sid, userData] of connectedUsers) {
        if (sid !== socket.id && userData.conversationId === cid) {
          io.to(sid).emit('partnerStopTyping', { sender });
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
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) return;
        const ChatMessage = mongoose.models.ChatMessage;
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

        const msgObj = message.toObject();
        msgObj._id = msgObj._id.toString();

        const cid = data.conversationId || CONVERSATION_ID;
        for (const [sid, userData] of connectedUsers) {
          if (userData.conversationId === cid) {
            io.to(sid).emit('messageReactionUpdated', {
              messageId: data.messageId,
              reactions: msgObj.reactions,
            });
          }
        }
      } catch (err) {
        console.error('[Socket.IO] Error adding reaction:', err);
      }
    });

    socket.on('editMessage', async (data) => {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) return;
        const ChatMessage = mongoose.models.ChatMessage;
        if (!ChatMessage) return;

        const message = await ChatMessage.findByIdAndUpdate(
          data.messageId,
          { content: data.content, isEdited: true },
          { new: true }
        );
        if (message) {
          const msgObj = message.toObject();
          msgObj._id = msgObj._id.toString();
          const cid = data.conversationId || CONVERSATION_ID;
          for (const [sid, userData] of connectedUsers) {
            if (userData.conversationId === cid) {
              io.to(sid).emit('messageUpdated', msgObj);
            }
          }
        }
      } catch (err) {
        console.error('[Socket.IO] Error editing:', err);
      }
    });

    socket.on('deleteMessage', async (data) => {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) return;
        const ChatMessage = mongoose.models.ChatMessage;
        if (!ChatMessage) return;

        const cid = data.conversationId || CONVERSATION_ID;
        if (data.deleteFor === 'both') {
          await ChatMessage.findByIdAndDelete(data.messageId);
          for (const [sid, userData] of connectedUsers) {
            if (userData.conversationId === cid) {
              io.to(sid).emit('messageDeleted', { messageId: data.messageId, deletedFor: 'both' });
            }
          }
        } else {
          await ChatMessage.findByIdAndUpdate(data.messageId, { $addToSet: { deletedFor: data.sender } });
          for (const [sid, userData] of connectedUsers) {
            if (userData.conversationId === cid) {
              io.to(sid).emit('messageDeleted', { messageId: data.messageId, deletedFor: 'me' });
            }
          }
        }
      } catch (err) {
        console.error('[Socket.IO] Error deleting:', err);
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
        console.log(`[Socket.IO] ${userData.sender} disconnected (${connectedUsers.size} online)`);
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
    console.log('> Socket.IO real-time server active\n');
  });
});
