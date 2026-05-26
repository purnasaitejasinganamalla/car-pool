const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, isMock } = require('./config/db');
const apiRouter = require('./routes/api');
const seedData = require('./utils/seedData');
const { runScheduler } = require('./scheduler/rideScheduler');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // open for dev environment
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: isMock() ? 'Local Mock (JSON File)' : 'MongoDB Server' });
});

// Socket.io Real-time connection handler
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('[Socket.io] New client connected:', socket.id);

  socket.on('register_user', (userId) => {
    if (userId) {
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      io.emit('user_status_change', { userId, status: 'online' });
      console.log(`[Socket.io] User ${userId} registered on socket ${socket.id}`);
    }
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text } = data;
    if (senderId && receiverId && text) {
      const chatId = [senderId, receiverId].sort().join('_');
      // Save message will be done in REST or socket. For safety, broadcast instantly:
      io.to(receiverId).emit('receive_message', {
        _id: Math.random().toString(),
        chatId,
        senderId,
        receiverId,
        text,
        createdAt: new Date().toISOString(),
        isSeen: false
      });
      console.log(`[Socket.io] Routed message from ${senderId} to ${receiverId}`);
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUser = null;
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        disconnectedUser = uid;
        onlineUsers.delete(uid);
        break;
      }
    }
    if (disconnectedUser) {
      io.emit('user_status_change', { userId: disconnectedUser, status: 'offline' });
      console.log(`[Socket.io] User ${disconnectedUser} disconnected.`);
    }
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. If running mock DB and JSON file is empty, seed it automatically
    if (isMock()) {
      const dbHelper = require('./config/db');
      const store = dbHelper.getModel('User').getRawStore();
      if (!store.users || store.users.length === 0) {
        console.log('[Database] Empty local JSON database detected. Running seed script...');
        await seedData();
      }
    }

    // 3. Initialize scheduler for today & tomorrow
    const { getLocalDateString } = require('./utils/dateHelper');
    const todayStr = getLocalDateString();
    await runScheduler(todayStr);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);
    await runScheduler(tomorrowStr);

    // 4. Start scheduler intervals (runs checks every 30 mins)
    setInterval(async () => {
      const current = getLocalDateString();
      await runScheduler(current);
    }, 30 * 60 * 1000);

    // 5. Start Server
    server.listen(PORT, () => {
      console.log('\n================================================================');
      console.log(`[Server] CampusRide Backend API server running on port ${PORT}`);
      console.log(`[Server] API Health Check: http://localhost:${PORT}/health`);
      console.log('================================================================\n');
    });

  } catch (error) {
    console.error('[Server] Initialization failed:', error);
    process.exit(1);
  }
};

startServer();
