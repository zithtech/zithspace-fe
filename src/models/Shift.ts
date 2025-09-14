import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workingMinutes: number;
  graceMinutes: number;
  lunchBreakMinutes: number;
  overtimeThreshold: number;
  isFlexible: boolean;
  flexibleStartRange?: number;
  flexibleEndRange?: number;
  isActive: boolean;
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      maxlength: [100, 'Shift name cannot be more than 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Shift code is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'Shift code cannot be more than 10 characters'],
      unique: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)'],
    },
    workingMinutes: {
      type: Number,
      required: [true, 'Working minutes is required'],
      min: [60, 'Working minutes must be at least 60'],
      max: [1440, 'Working minutes cannot exceed 1440 (24 hours)'],
    },
    graceMinutes: {
      type: Number,
      default: 15,
      min: [0, 'Grace minutes cannot be negative'],
      max: [60, 'Grace minutes cannot exceed 60'],
    },
    lunchBreakMinutes: {
      type: Number,
      default: 60,
      min: [0, 'Lunch break minutes cannot be negative'],
      max: [180, 'Lunch break minutes cannot exceed 180'],
    },
    overtimeThreshold: {
      type: Number,
      default: 0,
      min: [0, 'Overtime threshold cannot be negative'],
    },
    isFlexible: {
      type: Boolean,
      default: false,
    },
    flexibleStartRange: {
      type: Number,
      min: [0, 'Flexible start range cannot be negative'],
      max: [120, 'Flexible start range cannot exceed 120 minutes'],
    },
    flexibleEndRange: {
      type: Number,
      min: [0, 'Flexible end range cannot be negative'],
      max: [120, 'Flexible end range cannot exceed 120 minutes'],
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
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        return ret;
      },
    },
  }
);

// Indexes for performance
ShiftSchema.index({ code: 1 });
ShiftSchema.index({ isActive: 1 });
ShiftSchema.index({ isDefault: 1 });

// Ensure only one default shift
ShiftSchema.pre<IShift>('save', async function (next) {
  if (this.isDefault) {
    await mongoose.model('Shift').updateMany(
      { id: { $ne: this.id } },
      { isDefault: false }
    );
  }
  next();
});

// Calculate working minutes based on start and end time
ShiftSchema.pre<IShift>('save', function (next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    
    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }
    
    this.workingMinutes = endMinutes - startMinutes - this.lunchBreakMinutes;
  }
  next();
});

export default mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);
