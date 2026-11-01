import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permission, hasPermission } from '../types/auth';
import { StorageService, OFFICIAL_ADMIN, OFFICIAL_CREATOR_DEEP, OFFICIAL_CREATOR_ARIES } from '../services/storage';
import { PlatformNotification } from '../types/manga';
import { authenticateWithGoogleOAuth } from '../services/googleAuth';
import { testFirestoreConnection, auth, createUserWithEmailAndPassword } from '../services/firebase';
import { processSubscriptionSuccess } from '../services/razorpay';
import { DEFAULT_USER_AVATAR } from '../utils/avatar';

interface AuthContextType {
  user: User;
  users: User[];
  role: UserRole;
  isVIP: boolean;
  isAuthenticated: boolean;
  canAccessAdmin: boolean;
  canAccessCreator: boolean;
  canAccessVIP: boolean;
  hasPerm: (perm: Permission) => boolean;
  switchUserRole: (role: UserRole) => void;
  toggleCreatorMode: () => { newRole: UserRole; creatorId?: string };
  signIn: (identifier: string, pass: string, requestedRole?: UserRole) => Promise<boolean>;
  signUp: (username: string, email: string, pass: string, requestedRole?: UserRole) => Promise<boolean>;
  signInWithGoogle: (requestedRole?: UserRole, customUsername?: string, overrideClientId?: string) => Promise<boolean>;
  signInWithGoogleDirect: (email: string, name?: string, requestedRole?: UserRole) => Promise<boolean>;
  signOut: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateUsername: (newUsername: string) => { success: boolean; error?: string };
  activateSubscription: (
    planId: 'monthly' | 'yearly',
    paymentMethod?: 'UPI' | 'Card' | 'Netbanking' | 'Razorpay',
    customPaymentId?: string
  ) => { updatedUser: User; paymentRecord: any };
  cancelSubscription: () => void;
  refreshUser: () => void;
  notifications: PlatformNotification[];
  unreadNotifsCount: number;
  markNotificationsAsRead: () => void;
  bookmarks: string[];
  toggleBookmark: (seriesId: string) => boolean;
  likedSeries: string[];
  toggleLikeSeries: (seriesId: string) => { liked: boolean; likesCount: number };
  followedCreators: string[];
  toggleFollowCreator: (creatorId: string) => boolean;
  isAuthModalOpen: boolean;
  authModalOptions: OpenAuthModalOptions;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  hasCreatorProfile: boolean;
  deleteMyAccount: (mode: 'both' | 'creator_only') => void;
}

export interface OpenAuthModalOptions {
  title?: string;
  subtitle?: string;
  defaultRole?: 'reader' | 'creator' | 'admin';
  defaultMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => StorageService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const cur = StorageService.getCurrentUser();
    return Boolean(cur && cur.id !== 'guest_reader' && !cur.id.startsWith('guest_') && cur.email);
  });
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [notifications, setNotifications] = useState<PlatformNotification[]>(() =>
    StorageService.getNotifications(user.id)
  );
  const [bookmarks, setBookmarks] = useState<string[]>(() => StorageService.getBookmarks(user.id));
  const [likedSeries, setLikedSeries] = useState<string[]>(() => StorageService.getLikedSeries(user.id));
  const [followedCreators, setFollowedCreators] = useState<string[]>(() =>
    StorageService.getFollowedCreators(user.id)
  );

  // Global Auth Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalOptions, setAuthModalOptions] = useState<OpenAuthModalOptions>({});

  const openAuthModal = (options?: OpenAuthModalOptions) => {
    setAuthModalOptions(options || {});
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalOptions({});
  };

  useEffect(() => {
    setNotifications(StorageService.getNotifications(user.id));
    setBookmarks(StorageService.getBookmarks(user.id));
    setLikedSeries(StorageService.getLikedSeries(user.id));
    setFollowedCreators(StorageService.getFollowedCreators(user.id));
  }, [user.id]);

  const canAccessAdmin = user.role === 'admin';
  const canAccessCreator = user.role === 'creator' || user.role === 'admin';
  const canAccessVIP = user.isVIP || user.role === 'subscriber' || user.role === 'admin';

  const hasPerm = (perm: Permission): boolean => {
    return hasPermission(user, perm);
  };

  const toggleCreatorMode = (): { newRole: UserRole; creatorId?: string } => {
    if (!isAuthenticated || user.id === 'guest_reader') {
      return { newRole: 'free_user' };
    }

    const allUsers = StorageService.getUsers();
    const userIdx = allUsers.findIndex(u => u.id === user.id);

    if (user.role === 'creator') {
      // Switch back to Reader mode while preserving creatorProfileId
      const newRole: UserRole = user.isVIP ? 'subscriber' : 'free_user';
      const updatedUser: User = {
        ...user,
        role: newRole,
      };
      if (userIdx >= 0) {
        allUsers[userIdx] = updatedUser;
        StorageService.saveUsers(allUsers);
      }
      StorageService.setCurrentUser(updatedUser);
      setUser(updatedUser);
      return { newRole, creatorId: updatedUser.creatorProfileId };
    } else {
      // Switch to Creator mode on the SAME account
      let creatorId = user.creatorProfileId;
      const creators = StorageService.getCreators();
      let existingProfile = creatorId
        ? creators.find(c => c.id === creatorId)
        : creators.find(c => c.userId === user.id);

      if (!existingProfile) {
        creatorId = `creator_${user.id}`;
        existingProfile = {
          id: creatorId,
          userId: user.id,
          penName: user.username || user.name || 'Mangaka',
          handle: `@${user.username || user.name.toLowerCase().replace(/\s+/g, '_')}`,
          bio: '',
          avatarUrl: user.avatarUrl || DEFAULT_USER_AVATAR,
          followersCount: 0,
          seriesCount: 0,
          totalReads: 0,
          monthlyEarningsInr: 0,
          revenueSharePercent: 70,
          upiId: '',
          bankAccountHolder: user.username || user.name,
          verified: false,
          joinedAt: new Date().toISOString().split('T')[0],
        };
        creators.push(existingProfile);
        StorageService.saveCreators(creators);
      } else {
        creatorId = existingProfile.id;
      }

      const updatedUser: User = {
        ...user,
        role: 'creator',
        creatorProfileId: creatorId,
      };

      if (userIdx >= 0) {
        allUsers[userIdx] = updatedUser;
        StorageService.saveUsers(allUsers);
      }
      StorageService.setCurrentUser(updatedUser);
      setUser(updatedUser);
      return { newRole: 'creator', creatorId };
    }
  };

  const switchUserRole = (targetRole: UserRole) => {
    // Strict security: Never allow arbitrary switching to admin
    if (targetRole === 'admin') {
      console.warn('Switching to admin role is disabled. Please sign in with administrator credentials.');
      return;
    }

    // If user is logged in, change their CURRENT account's role rather than switching accounts!
    if (isAuthenticated && user.id !== 'guest_reader') {
      const allUsers = StorageService.getUsers();
      const userIdx = allUsers.findIndex(u => u.id === user.id);

      let creatorId = user.creatorProfileId;
      if (targetRole === 'creator' && !creatorId) {
        creatorId = `creator_${user.id}`;
        const creators = StorageService.getCreators();
        const existingProfile = creators.find(c => c.userId === user.id);
        if (!existingProfile) {
          creators.push({
            id: creatorId,
            userId: user.id,
            penName: user.username,
            handle: `@${user.username}`,
            bio: '',
            avatarUrl: user.avatarUrl || DEFAULT_USER_AVATAR,
            followersCount: 0,
            seriesCount: 0,
            totalReads: 0,
            monthlyEarningsInr: 0,
            revenueSharePercent: 70,
            upiId: '',
            bankAccountHolder: user.username,
            verified: false,
            joinedAt: new Date().toISOString().split('T')[0],
          });
          StorageService.saveCreators(creators);
        } else {
          creatorId = existingProfile.id;
        }
      }

      const updatedUser: User = {
        ...user,
        role: targetRole,
        creatorProfileId: creatorId,
      };

      if (userIdx >= 0) {
        allUsers[userIdx] = updatedUser;
        StorageService.saveUsers(allUsers);
      }
      StorageService.setCurrentUser(updatedUser);
      setUser(updatedUser);
      return;
    }

    // Guest fallback: pick or create a demo user (never admin)
    const allUsers = StorageService.getUsers();
    let target = allUsers.find(u => u.role === targetRole);
    if (!target) {
      const generatedUsername = `${targetRole}_${Math.floor(Math.random() * 900 + 100)}`;
      target = {
        id: `user_${targetRole}_${Date.now()}`,
        name: generatedUsername,
        username: generatedUsername,
        email: `${targetRole}@mangawild.online`,
        password: 'password123',
        role: targetRole,
        isVIP: targetRole === 'subscriber',
        createdAt: new Date().toISOString(),
      };
      allUsers.push(target);
      StorageService.saveUsers(allUsers);
    }
    setUser(target);
    StorageService.setCurrentUser(target);
    setIsAuthenticated(target.id !== 'guest_reader' && Boolean(target.email));
  };

  const signIn = async (identifier: string, pass: string, requestedRole?: UserRole): Promise<boolean> => {
    if (!identifier || !identifier.trim()) {
      throw new Error('Please enter your username or email address.');
    }
    if (!pass || !pass.trim()) {
      throw new Error('Please enter your password.');
    }

    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    const allUsers = StorageService.getUsers();

    // Check if this is an attempt to log in as the official Administrator
    const isAdminId =
      cleanId === OFFICIAL_ADMIN.email.toLowerCase() ||
      cleanId === OFFICIAL_ADMIN.altEmail.toLowerCase() ||
      cleanId === OFFICIAL_ADMIN.username.toLowerCase() ||
      cleanId === 'mangawild_admin';

    if (isAdminId) {
      if (pass !== OFFICIAL_ADMIN.password) {
        throw new Error('Incorrect password. Administrator login failed.');
      }
      let adminAccount = allUsers.find(u => u.id === OFFICIAL_ADMIN.id || u.role === 'admin');
      if (!adminAccount) {
        adminAccount = {
          id: OFFICIAL_ADMIN.id,
          name: 'Admin',
          username: OFFICIAL_ADMIN.username,
          email: OFFICIAL_ADMIN.email,
          password: OFFICIAL_ADMIN.password,
          role: 'admin',
          avatarUrl: DEFAULT_USER_AVATAR,
          isVIP: true,
          createdAt: '2026-01-01T00:00:00Z',
        };
        allUsers.unshift(adminAccount);
      } else {
        adminAccount.role = 'admin';
        adminAccount.isVIP = true;
        adminAccount.email = OFFICIAL_ADMIN.email;
        adminAccount.password = OFFICIAL_ADMIN.password;
      }
      StorageService.saveUsers(allUsers);
      setUser(adminAccount);
      StorageService.setCurrentUser(adminAccount);
      setIsAuthenticated(true);
      return true;
    }

    // Find account by current username, current creator @handle, or email (never old/replaced usernames)
    const allCreators = StorageService.getCreators();
    const isDeepEmailLogin =
      cleanId === OFFICIAL_CREATOR_DEEP.email.toLowerCase() ||
      cleanId === OFFICIAL_CREATOR_DEEP.altEmail.toLowerCase();

    const isAriesEmailLogin =
      cleanId === OFFICIAL_CREATOR_ARIES.email.toLowerCase() ||
      cleanId === OFFICIAL_CREATOR_ARIES.altEmail.toLowerCase();

    const found = allUsers.find(u => {
      if (isDeepEmailLogin && u.id === OFFICIAL_CREATOR_DEEP.id) return true;
      if (isAriesEmailLogin && u.id === OFFICIAL_CREATOR_ARIES.id) return true;
      if (u.email && u.email.toLowerCase() === cleanId) return true;

      // Check linked creator profile's current handle first (if creator exists, its handle & u.username are synced)
      const creatorProfile = allCreators.find(
        c => c.userId === u.id || (u.creatorProfileId && c.id === u.creatorProfileId)
      );
      const currentCreatorHandle = creatorProfile?.handle
        ? creatorProfile.handle.replace(/^@+/, '').trim().toLowerCase()
        : '';

      if (currentCreatorHandle) {
        // When a creator profile is linked, only accept the current synced username/handle (old usernames are rejected)
        return currentCreatorHandle === cleanId || (u.username && u.username.toLowerCase() === cleanId && u.username.toLowerCase() === currentCreatorHandle);
      }

      return Boolean(u.username && u.username.toLowerCase() === cleanId);
    });

    if (!found) {
      throw new Error('No account found with this username or email. If you recently updated your username, please sign in with your new username or email address.');
    }

    // Check if account or linked creator profile is suspended
    const linkedCreator = allCreators.find(
      c => c.userId === found.id || (found.creatorProfileId && c.id === found.creatorProfileId)
    );
    if (linkedCreator?.handle) {
      const latestHandle = linkedCreator.handle.replace(/^@+/, '').trim().toLowerCase();
      if (latestHandle && found.username !== latestHandle) {
        found.username = latestHandle;
      }
    }
    if (found.isSuspended || linkedCreator?.isSuspended) {
      const reason =
        found.suspensionReason ||
        linkedCreator?.suspensionReason ||
        'Your account has been suspended by the MangaWild Administrator.';
      throw new Error(`ACCOUNT_SUSPENDED:${reason}`);
    }

    // Strict security: An account can ONLY have admin privileges if it is the verified official admin
    if (found.role === 'admin') {
      found.role = 'free_user';
    }

    const expectedPassword = found.password || 'password123';
    const isDeepValidPass =
      found.id === OFFICIAL_CREATOR_DEEP.id &&
      (pass === OFFICIAL_CREATOR_DEEP.password || pass === expectedPassword || pass === 'password123');
    const isAriesValidPass =
      found.id === OFFICIAL_CREATOR_ARIES.id &&
      (pass === OFFICIAL_CREATOR_ARIES.password || pass === expectedPassword || pass === 'password123');

    if (pass !== expectedPassword && !isDeepValidPass && !isAriesValidPass) {
      throw new Error('Incorrect password. Please enter the valid password you created during sign up.');
    }

    if (found.id === OFFICIAL_CREATOR_DEEP.id) {
      found.role = 'creator';
      found.creatorProfileId = OFFICIAL_CREATOR_DEEP.creatorProfileId;
      found.email = OFFICIAL_CREATOR_DEEP.email;
      StorageService.saveUsers(allUsers);
    } else if (found.id === OFFICIAL_CREATOR_ARIES.id) {
      found.role = 'creator';
      found.creatorProfileId = OFFICIAL_CREATOR_ARIES.creatorProfileId;
      found.email = OFFICIAL_CREATOR_ARIES.email;
      StorageService.saveUsers(allUsers);
    }

    // Update role if explicitly requested (e.g. reader chooses creator)
    if (requestedRole && requestedRole === 'creator' && found.role !== 'creator') {
      found.role = 'creator';
      if (!found.creatorProfileId) {
        const creatorId = `creator_${Date.now()}`;
        found.creatorProfileId = creatorId;
        const creators = StorageService.getCreators();
        creators.push({
          id: creatorId,
          userId: found.id,
          penName: found.username,
          handle: `@${found.username}`,
          bio: '',
          avatarUrl: found.avatarUrl || DEFAULT_USER_AVATAR,
          followersCount: 0,
          seriesCount: 0,
          totalReads: 0,
          monthlyEarningsInr: 0,
          revenueSharePercent: 70,
          upiId: '',
          bankAccountHolder: found.username,
          verified: false,
          joinedAt: new Date().toISOString().split('T')[0],
        });
        StorageService.saveCreators(creators);
      }
      StorageService.saveUsers(allUsers);
    }

    setUser(found);
    StorageService.setCurrentUser(found);
    setIsAuthenticated(true);
    return true;
  };

  const signUp = async (
    username: string,
    email: string,
    pass: string,
    requestedRole: UserRole = 'free_user'
  ): Promise<boolean> => {
    // Strict security: Admin registration is forbidden
    if (requestedRole === 'admin') {
      throw new Error('Admin registration is strictly prohibited. Only authorized system administrators may log in.');
    }

    // Sanitize and validate unique username
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanEmail === OFFICIAL_ADMIN.email.toLowerCase() ||
      cleanEmail === OFFICIAL_ADMIN.altEmail.toLowerCase() ||
      cleanUsername === OFFICIAL_ADMIN.username.toLowerCase()
    ) {
      throw new Error('This identifier is reserved for the system administrator. Please sign in instead.');
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long and contain only letters, numbers, or underscores.');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!pass || pass.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const allUsers = StorageService.getUsers();

    // Prevent duplicate username
    const existingUser = allUsers.find(u => u.username && u.username.toLowerCase() === cleanUsername);
    if (existingUser) {
      throw new Error(`Username @${cleanUsername} is already registered. Please choose another username.`);
    }

    // Prevent duplicate email
    const existingEmail = allUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      throw new Error(`An account with email ${cleanEmail} already exists. Please sign in with your password.`);
    }

    const isCreatorRole = requestedRole === 'creator';
    const creatorId = isCreatorRole ? `creator_${Date.now()}` : undefined;

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: cleanUsername,
      username: cleanUsername,
      email: cleanEmail,
      password: pass,
      role: requestedRole,
      isVIP: requestedRole === 'subscriber',
      creatorProfileId: creatorId,
      createdAt: new Date().toISOString(),
    };

    allUsers.push(newUser);
    StorageService.saveUsers(allUsers);

    if (isCreatorRole && creatorId) {
      const creators = StorageService.getCreators();
      creators.push({
        id: creatorId,
        userId: newUser.id,
        penName: cleanUsername,
        handle: `@${cleanUsername}`,
        bio: '',
        avatarUrl: DEFAULT_USER_AVATAR,
        followersCount: 0,
        seriesCount: 0,
        totalReads: 0,
        monthlyEarningsInr: 0,
        revenueSharePercent: 70,
        upiId: '',
        bankAccountHolder: cleanUsername,
        verified: false,
        joinedAt: new Date().toISOString().split('T')[0],
      });
      StorageService.saveCreators(creators);
    }

    setUser(newUser);
    StorageService.setCurrentUser(newUser);
    setIsAuthenticated(true);

    // Asynchronously sync user account to Firebase Authentication
    createUserWithEmailAndPassword(auth, cleanEmail, pass).catch((err: any) => {
      // If already exists or App Check notice, ignore safely
      console.warn('Firebase Auth background sync notice:', err?.code || err?.message);
    });

    return true;
  };

  const signInWithGoogle = async (
    requestedRole: UserRole = 'free_user',
    customUsername?: string,
    overrideClientId?: string
  ): Promise<boolean> => {
    try {
      const googleProfile = await authenticateWithGoogleOAuth(overrideClientId);
      if (!googleProfile.email) return false;

      const allUsers = StorageService.getUsers();
      const isDeepGoogleEmail =
        googleProfile.email.toLowerCase() === OFFICIAL_CREATOR_DEEP.email.toLowerCase() ||
        googleProfile.email.toLowerCase() === OFFICIAL_CREATOR_DEEP.altEmail.toLowerCase();
      const isAriesGoogleEmail =
        googleProfile.email.toLowerCase() === OFFICIAL_CREATOR_ARIES.email.toLowerCase() ||
        googleProfile.email.toLowerCase() === OFFICIAL_CREATOR_ARIES.altEmail.toLowerCase();

      let found = allUsers.find(
        u =>
          (isDeepGoogleEmail && u.id === OFFICIAL_CREATOR_DEEP.id) ||
          (isAriesGoogleEmail && u.id === OFFICIAL_CREATOR_ARIES.id) ||
          u.email.toLowerCase() === googleProfile.email.toLowerCase()
      );

      if (found && isDeepGoogleEmail) {
        found.role = 'creator';
        found.creatorProfileId = OFFICIAL_CREATOR_DEEP.creatorProfileId;
        found.email = OFFICIAL_CREATOR_DEEP.email;
        StorageService.saveUsers(allUsers);
      } else if (found && isAriesGoogleEmail) {
        found.role = 'creator';
        found.creatorProfileId = OFFICIAL_CREATOR_ARIES.creatorProfileId;
        found.email = OFFICIAL_CREATOR_ARIES.email;
        StorageService.saveUsers(allUsers);
      }

      const isAdminEmail =
        googleProfile.email.toLowerCase() === OFFICIAL_ADMIN.email.toLowerCase() ||
        googleProfile.email.toLowerCase() === OFFICIAL_ADMIN.altEmail.toLowerCase();
      const assignedRole = isAdminEmail
        ? 'admin'
        : isDeepGoogleEmail || isAriesGoogleEmail
        ? 'creator'
        : requestedRole === 'admin'
        ? 'free_user'
        : requestedRole;

      if (!found) {
        const username = customUsername || googleProfile.name?.replace(/\s+/g, '_').toLowerCase() || googleProfile.email.split('@')[0];
        const isCreatorRole = assignedRole === 'creator';
        const creatorId = isCreatorRole ? `creator_${Date.now()}` : undefined;

        found = {
          id: googleProfile.id || `google_${Date.now()}`,
          name: googleProfile.name || 'Manga Reader',
          username: username.replace(/[^a-zA-Z0-9_]/g, ''),
          email: googleProfile.email,
          avatarUrl: googleProfile.avatarUrl || undefined,
          role: assignedRole,
          isVIP: assignedRole === 'admin' || assignedRole === 'subscriber',
          creatorProfileId: creatorId,
          createdAt: new Date().toISOString(),
        };

        allUsers.push(found);
        StorageService.saveUsers(allUsers);

        if (isCreatorRole && creatorId) {
          const creators = StorageService.getCreators();
          creators.push({
            id: creatorId,
            userId: found.id,
            penName: found.name,
            handle: `@${found.username}`,
            bio: '',
            avatarUrl: found.avatarUrl || DEFAULT_USER_AVATAR,
            followersCount: 0,
            seriesCount: 0,
            totalReads: 0,
            monthlyEarningsInr: 0,
            revenueSharePercent: 70,
            verified: false,
            joinedAt: new Date().toISOString().split('T')[0],
          });
          StorageService.saveCreators(creators);
        }
      }

      const linkedCreator = StorageService.getCreators().find(
        c => c.userId === found!.id || (found!.creatorProfileId && c.id === found!.creatorProfileId)
      );
      if (found.isSuspended || linkedCreator?.isSuspended) {
        const reason =
          found.suspensionReason ||
          linkedCreator?.suspensionReason ||
          'Your account has been suspended by the MangaWild Administrator.';
        throw new Error(`ACCOUNT_SUSPENDED:${reason}`);
      }

      setUser(found);
      StorageService.setCurrentUser(found);
      setIsAuthenticated(true);
      return true;
    } catch (err: any) {
      console.warn('Google OAuth sign-in error or cancelled:', err);
      throw err;
    }
  };

  const signInWithGoogleDirect = async (
    email: string,
    name?: string,
    requestedRole: UserRole = 'free_user'
  ): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid Google email address.');
    }
    const allUsers = StorageService.getUsers();
    const isDeepGoogleEmail =
      cleanEmail === OFFICIAL_CREATOR_DEEP.email.toLowerCase() ||
      cleanEmail === OFFICIAL_CREATOR_DEEP.altEmail.toLowerCase();
    const isAriesGoogleEmail =
      cleanEmail === OFFICIAL_CREATOR_ARIES.email.toLowerCase() ||
      cleanEmail === OFFICIAL_CREATOR_ARIES.altEmail.toLowerCase();

    let found = allUsers.find(
      u =>
        (isDeepGoogleEmail && u.id === OFFICIAL_CREATOR_DEEP.id) ||
        (isAriesGoogleEmail && u.id === OFFICIAL_CREATOR_ARIES.id) ||
        (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (found && isDeepGoogleEmail) {
      found.role = 'creator';
      found.creatorProfileId = OFFICIAL_CREATOR_DEEP.creatorProfileId;
      found.email = OFFICIAL_CREATOR_DEEP.email;
      StorageService.saveUsers(allUsers);
    } else if (found && isAriesGoogleEmail) {
      found.role = 'creator';
      found.creatorProfileId = OFFICIAL_CREATOR_ARIES.creatorProfileId;
      found.email = OFFICIAL_CREATOR_ARIES.email;
      StorageService.saveUsers(allUsers);
    }

    const isAdminEmail =
      cleanEmail === OFFICIAL_ADMIN.email.toLowerCase() ||
      cleanEmail === OFFICIAL_ADMIN.altEmail.toLowerCase();
    const assignedRole = isAdminEmail
      ? 'admin'
      : isDeepGoogleEmail || isAriesGoogleEmail
      ? 'creator'
      : requestedRole === 'admin'
      ? 'free_user'
      : requestedRole;

    if (!found) {
      const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
      found = {
        id: `google_${Date.now()}`,
        name: name || cleanEmail.split('@')[0],
        username,
        email: cleanEmail,
        avatarUrl: DEFAULT_USER_AVATAR,
        role: assignedRole,
        isVIP: assignedRole === 'admin' || assignedRole === 'subscriber',
        createdAt: new Date().toISOString(),
      };
      allUsers.push(found);
      StorageService.saveUsers(allUsers);
    }

    const linkedCreator = StorageService.getCreators().find(
      c => c.userId === found!.id || (found!.creatorProfileId && c.id === found!.creatorProfileId)
    );
    if (found.isSuspended || linkedCreator?.isSuspended) {
      const reason =
        found.suspensionReason ||
        linkedCreator?.suspensionReason ||
        'Your account has been suspended by the MangaWild Administrator.';
      throw new Error(`ACCOUNT_SUSPENDED:${reason}`);
    }

    setUser(found);
    StorageService.setCurrentUser(found);
    setIsAuthenticated(true);
    return true;
  };

  const signOut = () => {
    setIsAuthenticated(false);
    const guestUser: User = {
      id: 'guest_reader',
      name: 'Guest Reader',
      username: 'guest',
      email: '',
      role: 'free_user',
      isVIP: false,
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
    StorageService.setCurrentUser(guestUser);
  };

  const updateUser = (updates: Partial<User>) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    StorageService.setCurrentUser(updated);
    setUsers(StorageService.getUsers());
  };

  const updateUsername = (newUsername: string): { success: boolean; error?: string } => {
    const clean = newUsername.trim().replace(/^@+/, '').toLowerCase();
    if (!clean || clean.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      return { success: false, error: 'Username can only contain letters, numbers, and underscores.' };
    }
    // Check uniqueness among other users and creators
    const allUsers = StorageService.getUsers();
    const allCreators = StorageService.getCreators();
    const existingUser = allUsers.find(u => u.id !== user.id && u.username?.toLowerCase() === clean);
    const existingCreator = allCreators.find(
      c =>
        c.userId !== user.id &&
        c.id !== user.creatorProfileId &&
        c.handle?.replace(/^@+/, '').trim().toLowerCase() === clean
    );
    if (existingUser || existingCreator) {
      return { success: false, error: 'This username is already taken. Please choose another.' };
    }

    const updated = StorageService.updateUser(user.id, { username: clean }) || { ...user, username: clean };
    setUser(updated);
    StorageService.setCurrentUser(updated);
    setUsers(StorageService.getUsers());

    return { success: true };
  };

  const markNotificationsAsRead = () => {
    StorageService.markNotificationsRead(user.id);
    setNotifications(StorageService.getNotifications(user.id));
  };

  const toggleBookmark = (seriesId: string): boolean => {
    const added = StorageService.toggleBookmark(user.id, seriesId);
    setBookmarks(StorageService.getBookmarks(user.id));
    return added;
  };

  const toggleLikeSeries = (seriesId: string): { liked: boolean; likesCount: number } => {
    const res = StorageService.toggleLikeSeries(user.id, seriesId);
    setLikedSeries(StorageService.getLikedSeries(user.id));
    return res;
  };

  const toggleFollowCreator = (creatorId: string): boolean => {
    const followed = StorageService.toggleFollowCreator(user.id, creatorId);
    setFollowedCreators(StorageService.getFollowedCreators(user.id));
    return followed;
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const activateSubscription = (
    planId: 'monthly' | 'yearly',
    paymentMethod: 'UPI' | 'Card' | 'Netbanking' | 'Razorpay' = 'Razorpay',
    customPaymentId?: string
  ) => {
    const res = processSubscriptionSuccess(user, planId, paymentMethod, customPaymentId);
    setUser(res.updatedUser);
    setIsAuthenticated(true);
    setNotifications(StorageService.getNotifications(res.updatedUser.id));
    return res;
  };

  const cancelSubscription = () => {
    const updatedRole: UserRole = user.role === 'subscriber' ? 'free_user' : user.role;
    const updatedUser: User = {
      ...user,
      role: updatedRole,
      isVIP: false,
      subscription: undefined,
    };

    const allUsers = StorageService.getUsers();
    const idx = allUsers.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      allUsers[idx] = updatedUser;
      StorageService.saveUsers(allUsers);
    }

    StorageService.setCurrentUser(updatedUser);
    setUser(updatedUser);
    setUsers(StorageService.getUsers());
    localStorage.removeItem('mw_sub_cancelled');
  };

  const refreshUser = () => {
    const cur = StorageService.getCurrentUser();
    setUser(cur);
    setIsAuthenticated(Boolean(cur && cur.id !== 'guest_reader' && !cur.id.startsWith('guest_') && cur.email));
    setNotifications(StorageService.getNotifications(cur.id));
  };

  const effectiveIsVIP = Boolean(
    user.isVIP ||
    user.subscription?.status === 'active' ||
    user.role === 'subscriber' ||
    user.role === 'admin'
  );

  const hasCreatorProfile = Boolean(
    isAuthenticated &&
      user.id !== 'guest_reader' &&
      (user.creatorProfileId ||
        user.role === 'creator' ||
        StorageService.getCreators().some(c => c.userId === user.id || c.id === user.creatorProfileId))
  );

  const deleteMyAccount = (mode: 'both' | 'creator_only') => {
    if (!isAuthenticated || user.id === 'guest_reader' || user.id === OFFICIAL_ADMIN.id) return;
    if (mode === 'creator_only') {
      StorageService.deleteCreatorOnly(user.id);
      const updated = StorageService.getCurrentUser();
      setUser(updated);
      setUsers(StorageService.getUsers());
    } else {
      StorageService.deleteUserAndCreatorAccount(user.id);
      signOut();
      setUsers(StorageService.getUsers());
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        role: user.role,
        isVIP: effectiveIsVIP,
        isAuthenticated,
        canAccessAdmin,
        canAccessCreator,
        canAccessVIP,
        hasPerm,
        switchUserRole,
        toggleCreatorMode,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGoogleDirect,
        signOut,
        updateUser,
        updateUsername,
        activateSubscription,
        cancelSubscription,
        refreshUser,
        notifications,
        unreadNotifsCount,
        markNotificationsAsRead,
        bookmarks,
        toggleBookmark,
        likedSeries,
        toggleLikeSeries,
        followedCreators,
        toggleFollowCreator,
        isAuthModalOpen,
        authModalOptions,
        openAuthModal,
        closeAuthModal,
        hasCreatorProfile,
        deleteMyAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
