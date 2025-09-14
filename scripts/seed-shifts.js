const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define the Shift schema (same as in the model)
const ShiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    workingMinutes: {
      type: Number,
      required: true,
    },
    graceMinutes: {
      type: Number,
      default: 15,
    },
    lunchBreakMinutes: {
      type: Number,
      default: 60,
    },
    overtimeThreshold: {
      type: Number,
      default: 0,
    },
    isFlexible: {
      type: Boolean,
      default: false,
    },
    flexibleStartRange: {
      type: Number,
    },
    flexibleEndRange: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define the User schema (minimal version for this script)
const UserSchema = new mongoose.Schema({
  name: String,
  role: String,
  // ... other fields not needed for this script
}, { timestamps: true });

const Shift = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedShifts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a super_admin user to use as creator
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!superAdmin) {
      console.error('No super_admin user found. Please run seed-admin.js first.');
      process.exit(1);
    }

    // Check if shifts already exist
    const existingShifts = await Shift.countDocuments();
    if (existingShifts > 0) {
      console.log('Shifts already exist. Skipping seed.');
      process.exit(0);
    }

    // Create default shifts
    const shifts = [
      {
        name: 'Morning Shift',
        code: 'MS',
        startTime: '09:00',
        endTime: '18:00',
        workingMinutes: 480, // 8 hours (9 hours - 1 hour lunch)
        graceMinutes: 15,
        lunchBreakMinutes: 60,
        overtimeThreshold: 30, // OT after 30 minutes
        isFlexible: false,
        isActive: true,
        isDefault: true,
        createdBy: superAdmin.id,
      },
      {
        name: 'Evening Shift',
        code: 'ES',
        startTime: '14:00',
        endTime: '23:00',
        workingMinutes: 480, // 8 hours (9 hours - 1 hour lunch)
        graceMinutes: 15,
        lunchBreakMinutes: 60,
        overtimeThreshold: 30,
        isFlexible: false,
        isActive: true,
        isDefault: false,
        createdBy: superAdmin.id,
      },
      {
        name: 'Night Shift',
        code: 'NS',
        startTime: '22:00',
        endTime: '07:00',
        workingMinutes: 480, // 8 hours (9 hours - 1 hour lunch)
        graceMinutes: 15,
        lunchBreakMinutes: 60,
        overtimeThreshold: 30,
        isFlexible: false,
        isActive: true,
        isDefault: false,
        createdBy: superAdmin.id,
      },
      {
        name: 'Flexible Shift',
        code: 'FS',
        startTime: '09:00',
        endTime: '18:00',
        workingMinutes: 480, // 8 hours (9 hours - 1 hour lunch)
        graceMinutes: 30,
        lunchBreakMinutes: 60,
        overtimeThreshold: 30,
        isFlexible: true,
        flexibleStartRange: 120, // Can start 2 hours early or late
        flexibleEndRange: 120,
        isActive: true,
        isDefault: false,
        createdBy: superAdmin.id,
      },
    ];

    // Insert shifts
    const createdShifts = await Shift.insertMany(shifts);
    console.log(`✅ Created ${createdShifts.length} shifts:`);
    
    createdShifts.forEach(shift => {
      console.log(`   - ${shift.name} (${shift.code}): ${shift.startTime} - ${shift.endTime}${shift.isDefault ? ' [DEFAULT]' : ''}`);
    });

    console.log('\n🎉 Shift seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding shifts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedShifts();
