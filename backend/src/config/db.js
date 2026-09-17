import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agentguard';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[db] connected → ${uri.replace(/\/\/.*@/, '//***@')}`);
  return mongoose.connection;
}

export function dbStatus() {
  const map = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return map[mongoose.connection.readyState] ?? 'unknown';
}
