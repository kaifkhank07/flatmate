import { Schema, model, Document, Types } from 'mongoose';

export type Gender = 'male' | 'female' | 'other' | 'any';
export type Occupation =
  | 'student'
  | 'working_professional'
  | 'self_employed'
  | 'business_owner'
  | 'freelancer'
  | 'other';

export interface IProfileImage {
  url?: string;
  key?: string;
}

export interface IUserProfile extends Document {
  userId: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  occupation?: Occupation;
  languagesKnown?: string[];
  aboutMe?: string;
  image?: IProfileImage;
  preferences?: Types.ObjectId[];
  profileCompletion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'any'],
    },
    occupation: {
      type: String,
      enum: [
        'student',
        'working_professional',
        'self_employed',
        'business_owner',
        'freelancer',
        'other',
      ],
    },
    languagesKnown: [{ type: String, trim: true }],
    aboutMe: { type: String, trim: true },
    image: {
      url: { type: String, trim: true },
      key: { type: String, trim: true },
    },
    preferences: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserPreference',
      },
    ],
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

userProfileSchema.index({ preferences: 1 });

export const UserProfile = model<IUserProfile>('UserProfile', userProfileSchema);
