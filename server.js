const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  const onlineUsers = new Map();
  const typingUsers = new Map();
  const CONVERSATION_ID = 'main';

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId || CONVERSATION_ID);
      const sender = socket.handshake.query?.sender || 'unknown';
      onlineUsers.set(socket.id, { sender, conversationId: conversationId || CONVERSATION_ID });
      socket.to(conversationId || CONVERSATION_ID).emit('partnerOnline');
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId || CONVERSATION_ID);
      const userData = onlineUsers.get(socket.id);
      if (userData) {
        socket.to(userData.conversationId).emit('partnerOffline', {
          lastSeen: new Date().toISOString(),
        });
        onlineUsers.delete(socket.id);
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

        io.to(data.conversationId || CONVERSATION_ID).emit('receiveMessage', messageObj);
      } catch (err) {
        console.error('[Socket.IO] Error saving message:', err);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      typingUsers.set(socket.id, { sender: data.sender, isTyping: true });
      socket.to(data.conversationId || CONVERSATION_ID).emit('partnerTyping');
    });

    socket.on('stopTyping', (data) => {
      typingUsers.delete(socket.id);
      socket.to(data.conversationId || CONVERSATION_ID).emit('partnerStopTyping');
    });

    socket.on('messageSeen', (data) => {
      socket.to(data.conversationId || CONVERSATION_ID).emit('messageSeen', {
        messageId: data.messageId,
      });
    });

    socket.on('messageDelivered', (data) => {
      socket.to(data.conversationId || CONVERSATION_ID).emit('messageDelivered', {
        messageId: data.messageId,
      });
    });

    socket.on('addReaction', async (data) => {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) return;

        const ChatMessage = mongoose.models.ChatMessage;
        if (!ChatMessage) return;

        const message = await ChatMessage.findById(data.messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
          (r) => r.sender === data.sender
        );

        if (existingIndex >= 0) {
          if (message.reactions[existingIndex].emoji === data.emoji) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions[existingIndex].emoji = data.emoji;
          }
        } else {
          message.reactions.push({ sender: data.sender, emoji: data.emoji });
        }

        await message.save();

        const messageObj = message.toObject();
        messageObj._id = messageObj._id.toString();

        io.to(data.conversationId || CONVERSATION_ID).emit('messageReactionUpdated', {
          messageId: data.messageId,
          reactions: messageObj.reactions,
        });
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
          const messageObj = message.toObject();
          messageObj._id = messageObj._id.toString();
          io.to(data.conversationId || CONVERSATION_ID).emit('messageUpdated', messageObj);
        }
      } catch (err) {
        console.error('[Socket.IO] Error editing message:', err);
      }
    });

    socket.on('deleteMessage', async (data) => {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) return;

        const ChatMessage = mongoose.models.ChatMessage;
        if (!ChatMessage) return;

        if (data.deleteFor === 'both') {
          await ChatMessage.findByIdAndDelete(data.messageId);
          io.to(data.conversationId || CONVERSATION_ID).emit('messageDeleted', {
            messageId: data.messageId,
            deletedFor: 'both',
          });
        } else {
          await ChatMessage.findByIdAndUpdate(data.messageId, {
            $addToSet: { deletedFor: data.sender },
          });
          socket.emit('messageDeleted', {
            messageId: data.messageId,
            deletedFor: 'me',
          });
        }
      } catch (err) {
        console.error('[Socket.IO] Error deleting message:', err);
      }
    });

    socket.on('disconnect', () => {
      const userData = onlineUsers.get(socket.id);
      if (userData) {
        socket.to(userData.conversationId).emit('partnerOffline', {
          lastSeen: new Date().toISOString(),
        });
        onlineUsers.delete(socket.id);
      }
      typingUsers.delete(socket.id);
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
