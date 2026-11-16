import { create } from 'zustand';
import apiClient from '@/lib/api';
import {
  User,
  UserProfile,
  AvatarItem,
  LoginRequest,
  RegisterWithMobileOTPRequest,
  VerifyRegistrationOTPRequest,
  VerifyMobileLoginOTPRequest,
  AuthApiResponse,
  RegistrationResponseData,
  LoginResponseData,
} from '@/types/auth';
import { useNotificationStore } from './useNotificationStore';

export interface UserPreferenceItem {
  _id: string;
  name: string;
  image?: { url?: string; key?: string };
  isActive: boolean;
}

interface AuthState {
  // State
  user: User | null;
  profile: UserProfile | null;
  masterPreferences: UserPreferenceItem[];
  avatars: AvatarItem[];
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  isPreferencesLoading: boolean;
  isAvatarsLoading: boolean;
  error: string | null;
  profileError: string | null;
  preferencesError: string | null;
  registrationData: RegisterWithMobileOTPRequest | null;
  registrationStep: 'details' | 'otp' | 'success';
  loginStep: 'phone' | 'otp';
  tempOtp: string | null;

  // Actions
  clearError: () => void;
  clearProfileError: () => void;
  clearPreferencesError: () => void;
  resetAuth: () => void;
  setRegistrationStep: (step: 'details' | 'otp' | 'success') => void;
  setLoginStep: (step: 'phone' | 'otp') => void;
  setProfile: (profile: UserProfile | null) => void;

  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterWithMobileOTPRequest) => Promise<boolean>;
  verifyRegistrationOTP: (data: VerifyRegistrationOTPRequest) => Promise<boolean>;
  sendLoginOTP: (mobile: string) => Promise<boolean>;
  verifyLoginOTP: (data: VerifyMobileLoginOTPRequest) => Promise<boolean>;

  // User Profile Operations
  fetchProfile: () => Promise<UserProfile | null>;
  updateProfile: (data: Partial<UserProfile> | FormData) => Promise<boolean>;
  uploadProfileImage: (file: File) => Promise<boolean>;
  deleteProfileImage: () => Promise<boolean>;
  selectAvatar: (avatarId: string) => Promise<boolean>;
  fetchAvatars: () => Promise<AvatarItem[]>;
  checkProfileCompletionStatus: () => Promise<boolean>;
  completeProfile: () => Promise<boolean>;

  // Preference Operations
  fetchMasterPreferences: () => Promise<UserPreferenceItem[]>;
  updateUserPreferences: (preferenceIds: string[]) => Promise<boolean>;
  checkPreferencesStatus: () => Promise<{ hasFivePreferences: boolean; preferencesCount: number }>;

  // Account Deletion Operations
  requestAccountDeletionOTP: () => Promise<{ success: boolean; message: string; destination?: string; expiresIn?: number }>;
  deleteAccountWithOTP: (otp: string) => Promise<{ success: boolean; message: string }>;

  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  masterPreferences: [],
  avatars: [],
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  isProfileLoading: false,
  isPreferencesLoading: false,
  isAvatarsLoading: false,
  error: null,
  profileError: null,
  preferencesError: null,
  registrationData: null,
  registrationStep: 'details',
  loginStep: 'phone',
  tempOtp: null,

  clearError: () => set({ error: null }),
  clearProfileError: () => set({ profileError: null }),
  clearPreferencesError: () => set({ preferencesError: null }),
  resetAuth: () => {
    useNotificationStore.getState().reset();
    set({
      user: null,
      profile: null,
      masterPreferences: [],
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      isProfileLoading: false,
      isPreferencesLoading: false,
      error: null,
      profileError: null,
      preferencesError: null,
    });
  },
  setRegistrationStep: (step) => set({ registrationStep: step }),
  setLoginStep: (step) => set({ loginStep: step }),
  setProfile: (profile) => set({ profile }),

  /**
   * Login with email/mobile and password
   * POST /api/users/login
   */
  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthApiResponse<LoginResponseData>>(
        '/users/login',
        data
      );

      const responseData = response.data?.data;

      if (response.data?.success && responseData?.user) {
        set({
          user: responseData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        get().fetchProfile();
        return true;
      } else {
        set({
          isLoading: false,
          error: response.data?.message || 'Login failed',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed. Please check your credentials.',
      });
      return false;
    }
  },

  /**
   * Register with Mobile OTP
   * POST /api/auth/mobile/register
   */
  register: async (data: RegisterWithMobileOTPRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthApiResponse<RegistrationResponseData>>(
        '/auth/mobile/register',
        data
      );

      if (response.data?.success) {
        const receivedOtp = response.data?.data?.otp || null;
        set({
          registrationData: data,
          registrationStep: 'otp',
          tempOtp: receivedOtp,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.data?.message || 'Registration failed',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Registration failed. Please try again.',
      });
      return false;
    }
  },

  /**
   * Verify Registration OTP
   * POST /api/auth/mobile/register/verify-otp
   */
  verifyRegistrationOTP: async (data: VerifyRegistrationOTPRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthApiResponse<{ user: User }>>(
        '/auth/mobile/register/verify-otp',
        data
      );

      const responseData = response.data?.data;

      if (response.data?.success) {
        set({
          user: responseData?.user || null,
          isAuthenticated: true,
          registrationStep: 'success',
          isLoading: false,
          error: null,
        });
        get().fetchProfile();
        return true;
      } else {
        set({
          isLoading: false,
          error: response.data?.message || 'OTP verification failed',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'OTP verification failed. Please try again.',
      });
      return false;
    }
  },

  /**
   * Send Mobile Login OTP
   * POST /api/auth/mobile/send-otp
   */
  sendLoginOTP: async (mobile: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthApiResponse>(
        '/auth/mobile/send-otp',
        { mobile }
      );

      if (response.data?.success) {
        const receivedOtp = response.data?.data?.otp || null;
        set({
          loginStep: 'otp',
          tempOtp: receivedOtp,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.data?.message || 'Failed to send OTP',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to send OTP. Please try again.',
      });
      return false;
    }
  },

  /**
   * Verify Mobile Login OTP & Issue HTTP-only Cookies
   * POST /api/auth/mobile/verify-otp
   */
  verifyLoginOTP: async (data: VerifyMobileLoginOTPRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthApiResponse<LoginResponseData>>(
        '/auth/mobile/verify-otp',
        data
      );

      const responseData = response.data?.data;

      if (response.data?.success && responseData?.user) {
        set({
          user: responseData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        get().fetchProfile();
        return true;
      } else {
        set({
          isLoading: false,
          error: response.data?.message || 'Login failed',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed. Please verify your OTP.',
      });
      return false;
    }
  },

  /**
   * Fetch current authenticated user's profile
   * GET /api/profile
   */
  fetchProfile: async () => {
    if (!get().isAuthenticated) {
      return null;
    }
    set({ isProfileLoading: true, profileError: null });
    try {
      const response = await apiClient.get<AuthApiResponse<UserProfile>>('/profile');
      if (response.data?.success && response.data?.data) {
        const profileData = response.data.data;
        set({
          profile: profileData,
          isProfileLoading: false,
          profileError: null,
        });
        return profileData;
      } else {
        set({
          isProfileLoading: false,
          profileError: response.data?.message || 'Failed to fetch profile',
        });
        return null;
      }
    } catch (err: any) {
      set({
        isProfileLoading: false,
        profileError: err?.response?.data?.message || err.message || 'Failed to fetch profile',
      });
      return null;
    }
  },

  /**
   * Update current user's profile
   * PATCH /api/profile
   */
  updateProfile: async (data: Partial<UserProfile> | FormData) => {
    set({ isProfileLoading: true, profileError: null });
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined;

      const response = await apiClient.patch<AuthApiResponse<UserProfile>>(
        '/profile',
        data,
        { headers }
      );

      if (response.data?.success && response.data?.data) {
        set({
          profile: response.data.data,
          isProfileLoading: false,
          profileError: null,
        });
        return true;
      } else {
        set({
          isProfileLoading: false,
          profileError: response.data?.message || 'Failed to update profile',
        });
        return false;
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to update profile';
      set({
        isProfileLoading: false,
        profileError: errorMessage,
      });
      return false;
    }
  },

  /**
   * Upload profile image
   * POST /api/profile/image
   */
  uploadProfileImage: async (file: File) => {
    set({ isProfileLoading: true, profileError: null });
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post<AuthApiResponse<UserProfile>>(
        '/profile/image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data?.success && response.data?.data) {
        set({
          profile: response.data.data,
          isProfileLoading: false,
          profileError: null,
        });
        return true;
      } else {
        set({
          isProfileLoading: false,
          profileError: response.data?.message || 'Failed to upload image',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isProfileLoading: false,
        profileError: err?.response?.data?.message || err.message || 'Failed to upload image',
      });
      return false;
    }
  },

  /**
   * Delete profile image
   * DELETE /api/profile/image
   */
  deleteProfileImage: async () => {
    set({ isProfileLoading: true, profileError: null });
    try {
      const response = await apiClient.delete<AuthApiResponse<UserProfile>>('/profile/image');
      if (response.data?.success && response.data?.data) {
        set({
          profile: response.data.data,
          isProfileLoading: false,
          profileError: null,
        });
        return true;
      } else {
        set({
          isProfileLoading: false,
          profileError: response.data?.message || 'Failed to delete profile image',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isProfileLoading: false,
        profileError: err?.response?.data?.message || err.message || 'Failed to delete profile image',
      });
      return false;
    }
  },

  /**
   * Fetch Master User Preferences
   * GET /api/user-preferences?status=active&limit=100
   */
  fetchMasterPreferences: async () => {
    set({ isPreferencesLoading: true, preferencesError: null });
    try {
      const response = await apiClient.get<AuthApiResponse<{ items: UserPreferenceItem[] }>>(
        '/user-preferences?status=active&limit=100'
      );
      if (response.data?.success && response.data?.data?.items) {
        const items = response.data.data.items;
        set({
          masterPreferences: items,
          isPreferencesLoading: false,
          preferencesError: null,
        });
        return items;
      } else {
        set({
          isPreferencesLoading: false,
          preferencesError: response.data?.message || 'Failed to load preferences',
        });
        return [];
      }
    } catch (err: any) {
      set({
        isPreferencesLoading: false,
        preferencesError: err?.response?.data?.message || err.message || 'Failed to load preferences',
      });
      return [];
    }
  },

  /**
   * Update User Selected Preferences
   * PATCH /api/profile with { preferences: preferenceIds }
   */
  updateUserPreferences: async (preferenceIds: string[]) => {
    set({ isPreferencesLoading: true, preferencesError: null });
    try {
      const response = await apiClient.patch<AuthApiResponse<UserProfile>>(
        '/profile',
        { preferences: preferenceIds }
      );

      if (response.data?.success && response.data?.data) {
        set({
          profile: response.data.data,
          isPreferencesLoading: false,
          preferencesError: null,
        });
        return true;
      } else {
        set({
          isPreferencesLoading: false,
          preferencesError: response.data?.message || 'Failed to update preferences',
        });
        return false;
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to update preferences';
      set({
        isPreferencesLoading: false,
        preferencesError: errorMessage,
      });
      return false;
    }
  },

  /**
   * Check if user has added at least 5 preferences
   * GET /api/profile/check-preferences
   */
  checkPreferencesStatus: async () => {
    if (!get().isAuthenticated) {
      return { hasFivePreferences: false, preferencesCount: 0 };
    }
    try {
      const response = await apiClient.get<
        AuthApiResponse<{
          hasFivePreferences: boolean;
          preferencesCount: number;
          requiredCount: number;
        }>
      >('/profile/check-preferences');

      if (response.data?.success && response.data?.data) {
        return {
          hasFivePreferences: response.data.data.hasFivePreferences === true,
          preferencesCount: response.data.data.preferencesCount || 0,
        };
      }
      return { hasFivePreferences: false, preferencesCount: 0 };
    } catch {
      return { hasFivePreferences: false, preferencesCount: 0 };
    }
  },

  /**
   * Fetch Active Master Avatars
   * GET /api/avatars?isActive=true&limit=100
   */
  fetchAvatars: async () => {
    set({ isAvatarsLoading: true });
    try {
      const response = await apiClient.get<AuthApiResponse<{ items: AvatarItem[] }>>(
        '/avatars?isActive=true&limit=100'
      );
      if (response.data?.success && response.data?.data?.items) {
        const items = response.data.data.items;
        set({
          avatars: items,
          isAvatarsLoading: false,
        });
        return items;
      } else {
        set({ isAvatarsLoading: false });
        return [];
      }
    } catch {
      set({ isAvatarsLoading: false });
      return [];
    }
  },

  /**
   * Select an avatar for current user profile
   * PATCH /api/profile with { avatar: avatarId }
   */
  selectAvatar: async (avatarId: string) => {
    return get().updateProfile({ avatar: avatarId } as any);
  },

  /**
   * Check profile completion status of current user
   * GET /api/profile/completion-status
   */
  checkProfileCompletionStatus: async (): Promise<boolean> => {
    if (!get().isAuthenticated) {
      return false;
    }
    try {
      const response = await apiClient.get<AuthApiResponse<{ completedOnce: boolean }>>(
        '/profile/completion-status'
      );
      if (response.data?.success && response.data?.data) {
        const completedOnce = response.data.data.completedOnce === true;
        const currentProfile = get().profile;
        if (currentProfile && currentProfile.completedOnce !== completedOnce) {
          set({
            profile: {
              ...currentProfile,
              completedOnce,
            },
          });
        }
        return completedOnce;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Mark profile as completed once for current user
   * PATCH /api/profile/complete
   */
  completeProfile: async (): Promise<boolean> => {
    if (!get().isAuthenticated) {
      return false;
    }
    set({ isProfileLoading: true, profileError: null });
    try {
      const response = await apiClient.patch<AuthApiResponse<{ completedOnce: boolean }>>(
        '/profile/complete'
      );
      if (response.data?.success) {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              completedOnce: true,
            },
            isProfileLoading: false,
            profileError: null,
          });
        } else {
          set({ isProfileLoading: false, profileError: null });
        }
        return true;
      }
      set({
        isProfileLoading: false,
        profileError: response.data?.message || 'Failed to mark profile as completed',
      });
      return false;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to mark profile as completed';
      set({
        isProfileLoading: false,
        profileError: errorMessage,
      });
      return false;
    }
  },

  /**
   * Request OTP for account deletion
   * POST /api/users/me/delete-otp
   */
  requestAccountDeletionOTP: async () => {
    try {
      const response = await apiClient.post<AuthApiResponse<{ destination?: string; expiresIn?: number }>>(
        '/users/me/delete-otp'
      );
      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message || 'Verification code sent successfully',
          destination: response.data.data?.destination,
          expiresIn: response.data.data?.expiresIn || 300,
        };
      }
      return {
        success: false,
        message: response.data?.message || 'Failed to send deletion OTP',
      };
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to request verification code';
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Verify OTP and soft-delete user account
   * DELETE /api/users/me with body { otp }
   */
  deleteAccountWithOTP: async (otp: string) => {
    try {
      const response = await apiClient.delete<AuthApiResponse<null>>('/users/me', {
        data: { otp },
      });
      if (response.data?.success) {
        await get().logout();
        return {
          success: true,
          message: response.data.message || 'Account deleted successfully',
        };
      }
      return {
        success: false,
        message: response.data?.message || 'Failed to delete account',
      };
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to verify OTP and delete account';
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Logout user & clear backend HTTP-only cookies
   * POST /api/users/logout
   */
  logout: async () => {
    try {
      await apiClient.post('/users/logout');
    } catch {
      try {
        await apiClient.post('/auth/mobile/logout');
      } catch {
        // Ignore logout errors and proceed clearing frontend state
      }
    }
    useNotificationStore.getState().reset();
    set({
      user: null,
      profile: null,
      masterPreferences: [],
      isAuthenticated: false,
      isLoading: false,
      isProfileLoading: false,
      isPreferencesLoading: false,
      error: null,
      profileError: null,
      preferencesError: null,
      registrationData: null,
      registrationStep: 'details',
      loginStep: 'phone',
    });
  },

  /**
   * Initialize Auth by checking HTTP-only Cookie with backend
   * GET /api/users/me
   */
  initializeAuth: async () => {
    try {
      const response = await apiClient.get<AuthApiResponse<{ user: User; profile?: UserProfile }>>('/users/me');
      if (response.data?.success && response.data?.data?.user) {
        set({
          user: response.data.data.user,
          profile: response.data.data.profile || null,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });
      }
    } catch {
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },
}));
