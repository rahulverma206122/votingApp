const mongoose = require('mongoose');
require('dotenv').config();

const mongoURL =
  process.env.MONGODB_URL ||
  process.env.MONGODB_URL_LOCAL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/voting_app';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log('✅ MongoDB connected:', mongoURL);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

module.exports = connectDB;