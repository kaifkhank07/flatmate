export interface User {
  _id: string;
  email?: string;
  mobile?: string;
  role: 'user';
  accountStatus: 'active' | 'inactive';
  emailVerified: boolean;
  mobileVerified: boolean;
  profileVerified: boolean;
  verificationStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  lastLoginAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deactiveAt?: string;
  deactiveBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileAvatar {
  _id: string;
  name?: string;
  image?: { url?: string; key?: string };
}

export interface UserProfile {
  _id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'any';
  occupation?: string;
  languagesKnown?: string[];
  aboutMe?: string;
  image?: { url?: string; key?: string };
  avatar?: UserProfileAvatar | string;
  preferences?: any[];
  profileCompletion?: number;
  completedOnce?: boolean;
}

export interface AvatarItem {
  _id: string;
  name: string;
  image: { url: string; key: string };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterWithMobileOTPRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

export interface VerifyRegistrationOTPRequest {
  mobile: string;
  otp: string;
}

export interface SendMobileLoginOTPRequest {
  mobile: string;
}

export interface VerifyMobileLoginOTPRequest {
  mobile: string;
  otp: string;
}

export interface LoginRequest {
  email?: string;
  mobile?: string;
  password: string;
}

export interface AuthApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface RegistrationResponseData {
  user: User;
  requiresMobileVerification: boolean;
  otp?: string;
}

export interface LoginResponseData {
  user: User;
  otp?: string;
}
