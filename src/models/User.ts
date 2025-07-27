import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: 'Developer' | 'CEO' | 'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  reportsTo?: mongoose.Types.ObjectId;
  password: string;
  dateOfBirth?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      unique: true,
    },
    personalEmail: {
      type: String,
      required: [true, 'Personal email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },
    workEmail: {
      type: String,
      required: [true, 'Work email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['super admin', 'admin', 'user'],
        message: 'Role must be either super admin, admin, or user',
      },
      default: 'user',
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      enum: {
        values: ['Developer', 'CEO', 'DevOps', 'Project Manager', 'Product Manager', 'UI/UX', 'Business Management'],
        message: 'Position must be one of the predefined values',
      },
    },
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        delete ret.password;
        return ret;
      },
    },
  }
);

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({
    $or: [{ personalEmail: email }, { workEmail: email }],
    isActive: true,
  });
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
