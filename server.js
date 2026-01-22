require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const http = require('http');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');

// Configuration
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:5500';
const MONGO_URI = process.env.MONGO_URI || '*';

// Initialize Server
const app = express();
const server = http.createServer(app);

// Enhanced Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_ORIGIN, 'http://172.0.0.1:5050'],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  connectionStateRecovery: {
    maxDisconnectionDuration: 120000
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({  
  origin: [FRONTEND_ORIGIN, 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10 GB in bytes
});


const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  skip: (req) => req.url.startsWith('/uploads')
});
app.use(limiter);

app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ limit: '10gb', extended: true }));


// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/uploads", express.static(path.join(__dirname, "uploads", "admins")));

// Database Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Enhanced Socket.IO Middleware
io.use((socket, next) => {
  try {
    // Development bypass
    if (process.env.NODE_ENV !== 'production') {
      if (socket.handshake.query.adminId) {
        socket.user = { id: socket.handshake.query.adminId, role: 'admin' };
        return next();
      }
      if (socket.handshake.query.studentId) {
        socket.user = { id: socket.handshake.query.studentId, role: 'student' };
        return next();
      }
    }

    // Production authentication
    const token = socket.handshake.auth?.token ||
                  socket.handshake.query?.token ||
                  (socket.handshake.headers.authorization || '').replace('Bearer ','');
    if (!token) return next(new Error('Authentication required'));
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'));
      
      socket.user = {
        id: decoded.userId || decoded.assistantId || decoded.adminId || decoded._id || decoded.id,
        role: decoded.role || decoded.userRole || decoded.type || 'user',
        ...decoded
      };
      
      next();
    });
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Room Management
const activeRooms = {};
app.set("activeRooms", activeRooms);
app.set("io", io);


// Routes
app.use('/api/ioc', require('./routes/ioc'));
// In server.js, add this with your other route imports:
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/analyze-ioc', require('./routes/analyze-ioc'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/prediction-ioc', require('./routes/predictionRouteIOC'));
// In server.js, add with other route imports:
app.use('/api/search', require('./routes/searchRoutes'));
// Add with other route imports in server.js
app.use('/api/tags', require('./routes/tagsRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});



// Chat rooms endpoint
app.get('/api/chat-rooms', async (req, res) => {
  try {
    const rooms = await ChatRoom.find().populate('participants');
    res.json({ status: 'success', data: rooms });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend is working 🎉');
});

// PeerJS Server with enhanced configuration
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs',
  proxied: true,
  alive_timeout: 60000,
  concurrent_limit: 5000,
  allow_discovery: true
});

app.use('/peerjs', peerServer);

// WebRTC status endpoint
app.get('/api/webrtc-status', (req, res) => {
  res.json({
    status: 'active',
    activeRooms: Object.keys(activeRooms).length,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File too large. Maximum size is 100MB' 
      });
    }
  }
  
  res.status(500).json({ 
    status: 'error',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`
    🚀 Server running on :http://localhost:${PORT}
    📡 Socket.IO: ws://localhost:${PORT}/socket.io/
    🎮 PeerJS: ws://localhost:${PORT}/peerjs
    💬 Chat: ws://localhost:${PORT}
    🌐 CORS Origin: ${FRONTEND_ORIGIN}
    🏫 Active rooms: ${Object.keys(activeRooms).length}
  `);
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('🔴 MongoDB connection closed');
      process.exit(0);
    });
  });
});


