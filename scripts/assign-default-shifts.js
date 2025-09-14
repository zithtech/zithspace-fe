const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define the User schema (minimal version for this script)
const UserSchema = new mongoose.Schema({
  name: String,
  assignedShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  workDays: [Number],
  shiftAssignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shiftAssignedDate: Date,
}, { timestamps: true });

// Define the Shift schema (minimal version for this script)
const ShiftSchema = new mongoose.Schema({
  name: String,
  code: String,
  isDefault: Boolean,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Shift = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);

async function assignDefaultShifts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the default shift (should be Morning Shift)
    const defaultShift = await Shift.findOne({ isDefault: true, isActive: true });
    
    if (!defaultShift) {
      console.error('No default shift found. Please run seed-shifts.js first.');
      process.exit(1);
    }

    console.log(`Found default shift: ${defaultShift.name} (${defaultShift.code})`);

    // Find a super_admin to use as the assigner
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!superAdmin) {
      console.error('No super_admin user found.');
      process.exit(1);
    }

    // Find all users without assigned shifts
    const usersWithoutShifts = await User.find({
      $or: [
        { assignedShift: { $exists: false } },
        { assignedShift: null }
      ]
    });

    console.log(`Found ${usersWithoutShifts.length} users without assigned shifts`);

    if (usersWithoutShifts.length === 0) {
      console.log('All users already have shifts assigned.');
      process.exit(0);
    }

    // Assign default shift to all users without shifts
    const updateResult = await User.updateMany(
      {
        $or: [
          { assignedShift: { $exists: false } },
          { assignedShift: null }
        ]
      },
      {
        $set: {
          assignedShift: defaultShift.id,
          workDays: [1, 2, 3, 4, 5], // Monday to Friday
          shiftAssignedBy: superAdmin.id,
          shiftAssignedDate: new Date(),
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} users with default shift assignment:`);
    console.log(`   - Shift: ${defaultShift.name} (${defaultShift.code})`);
    console.log(`   - Work Days: Monday to Friday`);
    console.log(`   - Assigned By: ${superAdmin.name}`);

    // List updated users
    const updatedUsers = await User.find({
      assignedShift: defaultShift.id,
      shiftAssignedBy: superAdmin.id,
    }).select('name');

    console.log('\n📋 Users assigned to default shift:');
    updatedUsers.forEach(user => {
      console.log(`   - ${user.name}`);
    });

    console.log('\n🎉 Default shift assignment completed successfully!');
    
  } catch (error) {
    console.error('❌ Error assigning default shifts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the assignment function
assignDefaultShifts();
