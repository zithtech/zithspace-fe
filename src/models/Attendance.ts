import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceBreak {
  type: 'lunch' | 'tea' | 'other';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
}

export interface IAttendance extends Document {
  member: mongoose.Types.ObjectId;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  breaks: IAttendanceBreak[];
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  effectiveWorkMinutes: number;
  overtimeMinutes: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'wfh';
  shift: mongoose.Types.ObjectId;
  isManualEntry: boolean;
  enteredBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceBreakSchema = new Schema({
  type: {
    type: String,
    enum: ['lunch', 'tea', 'other'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number,
    min: 0,
  },
}, { id: false });

const AttendanceSchema: Schema = new Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    clockIn: {
      type: Date,
    },
    clockOut: {
      type: Date,
    },
    breaks: [AttendanceBreakSchema],
    totalWorkMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Total work minutes cannot be negative'],
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Total break minutes cannot be negative'],
    },
    effectiveWorkMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Effective work minutes cannot be negative'],
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Overtime minutes cannot be negative'],
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'wfh'],
      required: [true, 'Status is required'],
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: [true, 'Shift is required'],
    },
    isManualEntry: {
      type: Boolean,
      default: false,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
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

// Compound index for unique attendance per member per date
AttendanceSchema.index({ member: 1, date: 1 }, { unique: true });

// Indexes for performance
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ shift: 1 });
AttendanceSchema.index({ member: 1, date: -1 });

// Calculate break durations
AttendanceBreakSchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  next();
});

// Calculate work minutes and status
AttendanceSchema.pre<IAttendance>('save', async function (next) {
  try {
    // Calculate total break minutes
    this.totalBreakMinutes = this.breaks.reduce((total, breakItem) => {
      return total + (breakItem.duration || 0);
    }, 0);

    // Calculate total work minutes if both clock in and out are present
    if (this.clockIn && this.clockOut) {
      const totalMinutes = Math.round((this.clockOut.getTime() - this.clockIn.getTime()) / (1000 * 60));
      this.totalWorkMinutes = Math.max(0, totalMinutes);
      this.effectiveWorkMinutes = Math.max(0, this.totalWorkMinutes - this.totalBreakMinutes);
    }

    // Get shift information for calculations
    const shift = await mongoose.model('Shift').findById(this.shift);
    if (shift) {
      // Calculate overtime
      if (this.effectiveWorkMinutes > shift.workingMinutes + shift.overtimeThreshold) {
        this.overtimeMinutes = this.effectiveWorkMinutes - shift.workingMinutes - shift.overtimeThreshold;
      } else {
        this.overtimeMinutes = 0;
      }

      // Determine status based on clock in time and shift
      if (this.clockIn && this.status !== 'wfh' && this.status !== 'absent') {
        const clockInTime = this.clockIn.getHours() * 60 + this.clockIn.getMinutes();
        const [shiftStartHour, shiftStartMinute] = shift.startTime.split(':').map(Number);
        const shiftStartTime = shiftStartHour * 60 + shiftStartMinute;
        
        const lateThreshold = shiftStartTime + shift.graceMinutes;
        
        if (clockInTime > lateThreshold) {
          this.status = 'late';
        } else if (this.effectiveWorkMinutes < shift.workingMinutes / 2) {
          this.status = 'half-day';
        } else {
          this.status = 'present';
        }
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Validate clock out is after clock in
AttendanceSchema.pre<IAttendance>('save', function (next) {
  if (this.clockIn && this.clockOut && this.clockOut <= this.clockIn) {
    next(new Error('Clock out time must be after clock in time'));
  } else {
    next();
  }
});

// Validate break times
AttendanceSchema.pre<IAttendance>('save', function (next) {
  for (const breakItem of this.breaks) {
    if (breakItem.endTime && breakItem.startTime && breakItem.endTime <= breakItem.startTime) {
      next(new Error('Break end time must be after break start time'));
      return;
    }
    
    // Validate break is within work hours
    if (this.clockIn && this.clockOut) {
      if (breakItem.startTime < this.clockIn || breakItem.startTime > this.clockOut) {
        next(new Error('Break start time must be within work hours'));
        return;
      }
      if (breakItem.endTime && (breakItem.endTime < this.clockIn || breakItem.endTime > this.clockOut)) {
        next(new Error('Break end time must be within work hours'));
        return;
      }
    }
  }
  next();
});

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
