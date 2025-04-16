const express = require('express');
const router = express.Router();
const ConversationLog = require('../models/ConversationLog');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect('/hadidi82/login');
  }
};

// Admin login page
router.get('/login', (req, res) => {
  res.sendFile(process.cwd() + '/admin/login.html');
});

// Admin login POST
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    // Create a session for the admin
    req.session.isAdmin = true;
    res.redirect('/hadidi82');
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Admin dashboard
router.get('/', isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + '/admin/dashboard.html');
});

// API to get conversation logs
router.get('/api/logs', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, startDate, endDate, language } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { userMessage: { $regex: search, $options: 'i' } },
        { botResponse: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (language) {
      query.language = language;
    }
    
    const logs = await ConversationLog
      .find(query)
      .sort({ timestamp: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();
      
    const total = await ConversationLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// API to get statistics
router.get('/api/stats', isAuthenticated, async (req, res) => {
  try {
    const totalConversations = await ConversationLog.countDocuments();
    
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const conversationsLastWeek = await ConversationLog.countDocuments({
      timestamp: { $gte: lastWeekStart }
    });
    
    const languageStats = await ConversationLog.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]);
    
    const dailyStats = await ConversationLog.aggregate([
      {
        $match: {
          timestamp: { $gte: lastWeekStart }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      totalConversations,
      conversationsLastWeek,
      languageStats,
      dailyStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/hadidi82/login');
});

module.exports = router;
