import { Schema, model, Document, Types } from 'mongoose';

export type PostType = 'property' | 'partner';

export type PropertyType =
  | 'room'
  | 'flat'
  | 'pg'
  | 'shared_apartment';

export type PartnerType =
  | 'roommate'
  | 'flatmate';

export type FurnishingType =
  | 'fully_furnished'
  | 'semi_furnished'
  | 'unfurnished';

export type GenderPreference = 'male' | 'female' | 'other' | 'any';

export type OccupationPreference =
  | 'student'
  | 'working_professional'
  | 'self_employed'
  | 'business_owner'
  | 'freelancer'
  | 'other'
  | 'any';

export type MaintenanceFrequency =
  | 'monthly'
  | 'yearly'
  | 'included'
  | 'one_time';

export type PostStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'blocked'
  | 'closed'
  | 'expired';

export interface IFlatmateRequirement extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  location: Types.ObjectId;

  title: string;
  slug: string;
  description: string;

  postType: PostType;
  propertyType?: PropertyType; // Required when postType = property
  partnerType?: PartnerType; // Required when postType = partner
  area: number;

  rent: number;
  securityDeposit: number;
  maintenanceCharges: {
    amount: number;
    frequency: MaintenanceFrequency;
  };
  furnishing: FurnishingType;
  parking: boolean;

  availableFrom: Date;
  genderPreference: GenderPreference;
  occupationPreference: OccupationPreference;

  userPreferences: Types.ObjectId[];
  amenities: Types.ObjectId[];

  images: Types.ObjectId[];
  videos: Types.ObjectId[];

  status: PostStatus;
  rejectionReason?: string;

  favoriteCount: number;

  approvedAt?: Date;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const flatmateRequirementSchema = new Schema<IFlatmateRequirement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location ID is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    postType: {
      type: String,
      enum: ['property', 'partner'],
      required: [true, 'Post type is required'],
    },

    propertyType: {
      type: String,
      enum: ['room', 'flat', 'pg', 'shared_apartment'],
      default: 'flat',
    },

    partnerType: {
      type: String,
      enum: ['roommate', 'flatmate'],
      default: 'flatmate',
    },

    area: {
      type: Number,
      default: 0,
      min: [0, 'Area cannot be negative'],
    },

    rent: {
      type: Number,
      required: [true, 'Rent amount is required'],
      min: [0, 'Rent amount cannot be negative'],
    },

    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },

    maintenanceCharges: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Maintenance amount cannot be negative'],
      },
      frequency: {
        type: String,
        enum: ['monthly', 'yearly', 'included', 'one_time'],
        default: 'yearly',
      },
    },

    furnishing: {
      type: String,
      enum: ['fully_furnished', 'semi_furnished', 'unfurnished'],
      default: 'semi_furnished',
    },

    parking: {
      type: Boolean,
      default: false,
    },

    availableFrom: {
      type: Date,
      required: [true, 'Available from date is required'],
    },

    genderPreference: {
      type: String,
      enum: ['male', 'female', 'other', 'any'],
      default: 'any',
    },

    occupationPreference: {
      type: String,
      enum: [
        'student',
        'working_professional',
        'self_employed',
        'business_owner',
        'freelancer',
        'other',
        'any',
      ],
      default: 'any',
    },

    userPreferences: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserPreference',
      },
    ],

    amenities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PropertyAmenity',
      },
    ],

    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Image',
      },
    ],

    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],

    status: {
      type: String,
      enum: [
        'draft',
        'pending',
        'approved',
        'rejected',
        'blocked',
        'closed',
        'expired',
      ],
      default: 'pending',
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    favoriteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    approvedAt: {
      type: Date,
    },

    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
flatmateRequirementSchema.index({ status: 1 });
flatmateRequirementSchema.index({ rent: 1 });
flatmateRequirementSchema.index({ availableFrom: 1 });

export const FlatmateRequirement = model<IFlatmateRequirement>(
  'FlatmateRequirement',
  flatmateRequirementSchema,
);


// import { Schema, model, Document, Types } from 'mongoose';

// export type PostType = 'property' | 'partner';

// export type PropertyType =
//   | 'room'
//   | 'flat'
//   | 'pg'
//   | 'shared_apartment';

// export type PartnerType =
//   | 'roommate'
//   | 'flatmate';

// export type Occupation =
//   | 'student'
//   | 'working_professional'
//   | 'self_employed'
//   | 'business_owner'
//   | 'freelancer'
//   | 'any';

// export type GenderPreference = 'male' | 'female' | 'any';

// export type PostStatus =
//   | 'draft'
//   | 'pending'
//   | 'approved'
//   | 'rejected'
//   | 'blocked'
//   | 'closed'
//   | 'expired';

// export interface IFlatmateRequirement extends Document {
//   _id: Types.ObjectId;

//   userId: Types.ObjectId;

//   title: string;
//   slug: string;
//   description?: string;

//   postType: PostType;
//   propertyType?: PropertyType; // Required when postType = property
//   partnerType?: PartnerType; // Required when postType = partner

//   location: Types.ObjectId;
//   budget: number;

//   occupationPreference: Occupation;
//   genderPreference: GenderPreference;
//   lifestylePreferences: Types.ObjectId[];
//   moveInDate: Date;
//   peopleCount?: number; // Number of people required / available
//   images: Types.ObjectId[];
//   videos: Types.ObjectId[];
//   expiresAt?: Date; // Optional post expiration

//   status: PostStatus;
//   rejectionReason?: string;

//   createdAt: Date;
//   updatedAt: Date;
// }

// export type IFlatmatePost = IFlatmateRequirement;
// export type IPostRequirement = IFlatmateRequirement;

// const flatmateRequirementSchema = new Schema<IFlatmateRequirement>(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: [true, 'User ID is required'],
//       index: true,
//     },

//     title: {
//       type: String,
//       required: [true, 'Title is required'],
//       trim: true,
//     },

//     slug: {
//       type: String,
//       unique: true,
//       lowercase: true,
//       trim: true,
//       index: true,
//     },

//     description: {
//       type: String,
//       trim: true,
//     },

//     postType: {
//       type: String,
//       enum: ['property', 'partner'],
//       required: [true, 'Post type is required'],
//       index: true,
//     },

//     propertyType: {
//       type: String,
//       enum: ['room', 'flat', 'pg', 'shared_apartment'],
//     },

//     partnerType: {
//       type: String,
//       enum: ['roommate', 'flatmate'],
//     },

//     location: {
//       type: Schema.Types.ObjectId,
//       ref: 'Location',
//       required: [true, 'Location ID is required'],
//       index: true,
//     },

//     budget: {
//       type: Number,
//       required: [true, 'Budget is required'],
//       min: [0, 'Budget cannot be negative'],
//     },

//     occupationPreference: {
//       type: String,
//       enum: [
//         'student',
//         'working_professional',
//         'self_employed',
//         'business_owner',
//         'freelancer',
//         'any',
//       ],
//       default: 'any',
//     },

//     genderPreference: {
//       type: String,
//       enum: ['male', 'female', 'any'],
//       default: 'any',
//     },

//     lifestylePreferences: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: 'UserPreference',
//       },
//     ],

//     moveInDate: {
//       type: Date,
//       required: [true, 'Move in date is required'],
//     },

//     peopleCount: {
//       type: Number,
//       min: 1,
//     },

//     images: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: 'Image',
//       },
//     ],

//     videos: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: 'Video',
//       },
//     ],

//     expiresAt: {
//       type: Date,
//       index: true,
//     },

//     status: {
//       type: String,
//       enum: ['draft', 'pending', 'approved', 'rejected', 'blocked', 'closed', 'expired'],
//       default: 'pending',
//       index: true,
//     },

//     rejectionReason: {
//       type: String,
//       trim: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /**
//  * Pre-validate hook for slug generation & post-specific type validation
//  */
// flatmateRequirementSchema.pre('validate', function (next) {
//   if (this.title && !this.slug) {
//     this.slug = this.title
//       .toLowerCase()
//       .trim()
//       .replace(/[^\w\s-]/g, '')
//       .replace(/[\s_-]+/g, '-')
//       .replace(/^-+|-+$/g, '');
//   }

//   if (this.postType === 'property') {
//     if (!this.propertyType) {
//       return next(
//         new Error('Property type is required for property posts')
//       );
//     }
//     this.partnerType = undefined;
//   }

//   if (this.postType === 'partner') {
//     if (!this.partnerType) {
//       return next(
//         new Error('Partner type is required for partner posts')
//       );
//     }
//     this.propertyType = undefined;
//   }

//   next();
// });

// flatmateRequirementSchema.index({ budget: 1 });

// export const FlatmateRequirement = model<IFlatmateRequirement>(
//   'FlatmateRequirement',
//   flatmateRequirementSchema,
// );

