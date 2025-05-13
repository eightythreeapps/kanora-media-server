const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Initialize the application
const app = express();

// Sample user data
const users = {
  'user@example.com': {
    id: '1',
    email: 'user@example.com',
    password: 'password123', // This would be hashed in a real application
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
  },
};

// In-memory token storage
const tokens = {};
const refreshTokens = {};

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic authentication middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.split(' ')[1];

  if (!tokens[token]) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
    });
  }

  req.user = tokens[token];
  next();
};

// Login endpoint
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
      timestamp: new Date().toISOString(),
    });
  }

  const user = users[email];

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      timestamp: new Date().toISOString(),
    });
  }

  const accessToken = uuidv4();
  const refreshToken = uuidv4();

  tokens[accessToken] = {
    id: user.id,
    email: user.email,
    displayName: user.displayName || `${user.firstName} ${user.lastName}`,
    firstName: user.firstName || 'Test',
    lastName: user.lastName || 'User',
  };

  refreshTokens[refreshToken] = {
    id: user.id,
    email: user.email,
  };

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`,
        firstName: user.firstName || 'Test',
        lastName: user.lastName || 'User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken,
      refreshToken,
      expiresIn: 3600,
    },
    timestamp: new Date().toISOString(),
  });
});

// Register endpoint
app.post('/auth/register', (req, res) => {
  const { email, password, firstName, lastName, displayName } = req.body;

  // Support both field formats
  const userDisplayName =
    displayName || (firstName && lastName) ? `${firstName} ${lastName}` : null;

  if (!email || !password || !userDisplayName) {
    return res.status(400).json({
      success: false,
      message:
        'Email, password, and either displayName or firstName+lastName are required',
      timestamp: new Date().toISOString(),
    });
  }

  if (users[email]) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
      timestamp: new Date().toISOString(),
    });
  }

  const newUser = {
    id: uuidv4(),
    email,
    password, // This would be hashed in a real application
    displayName: userDisplayName,
    firstName: firstName || userDisplayName.split(' ')[0],
    lastName: lastName || userDisplayName.split(' ').slice(1).join(' '),
  };

  users[email] = newUser;

  const accessToken = uuidv4();
  const refreshToken = uuidv4();

  tokens[accessToken] = {
    id: newUser.id,
    email: newUser.email,
    displayName: newUser.displayName,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
  };

  refreshTokens[refreshToken] = {
    id: newUser.id,
    email: newUser.email,
  };

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken,
      refreshToken,
      expiresIn: 3600,
    },
    timestamp: new Date().toISOString(),
  });
});

// Token refresh endpoint
app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens[refreshToken]) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      timestamp: new Date().toISOString(),
    });
  }

  const userInfo = refreshTokens[refreshToken];
  const user = users[userInfo.email];
  const accessToken = uuidv4();

  tokens[accessToken] = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  res.json({
    success: true,
    data: {
      accessToken,
      expiresIn: 3600,
    },
    timestamp: new Date().toISOString(),
  });
});

// Logout endpoint
app.post('/auth/logout', authMiddleware, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(' ')[1];

  delete tokens[token];

  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  });
});

// Current user endpoint
app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Forgot password endpoint
app.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
      timestamp: new Date().toISOString(),
    });
  }

  if (!users[email]) {
    // Don't reveal that the user doesn't exist for security reasons
    return res.json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
      timestamp: new Date().toISOString(),
    });
  }

  // In a real application, we would send a password reset email here

  res.json({
    success: true,
    message: 'Password reset link sent to your email.',
    timestamp: new Date().toISOString(),
  });
});

// Reset password endpoint
app.post('/auth/reset-password', (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: 'Token and password are required',
      timestamp: new Date().toISOString(),
    });
  }

  // In a real application, we would validate the token and update the password

  res.json({
    success: true,
    message: 'Password has been reset successfully.',
    timestamp: new Date().toISOString(),
  });
});

// Mock media endpoint
app.get('/api/media', (req, res) => {
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/', (req, res) => {
  res.json({
    name: 'Kanora Media Server API (Auth Only)',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint for monitoring and Docker health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// Start the server
const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Stub Auth Server is listening at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
