const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI


// User schema (simplified version)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  personalEmail: { type: String, required: true, unique: true },
  workEmail: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    required: true,
    enum: ['super_admin', 'admin', 'user'],
    default: 'user'
  },
  position: { 
    type: String, 
    required: true,
    enum: ['Developer','CEO', 'DevOps', 'Project Manager', 'Product Manager', 'UI/UX', 'Business Management']
  },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
