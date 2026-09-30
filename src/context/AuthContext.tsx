import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permission, hasPermission } from '../types/auth';
import { StorageService } from '../services/storage';
import { PlatformNotification } from '../types/manga';
import { signInWithGooglePopup, signOutFirebase, testFirestoreConnection } from '../services/firebase';

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
  signIn: (email: string, pass?: string, requestedRole?: UserRole) => Promise<boolean>;
  signUp: (name: string, email: string, pass?: string, requestedRole?: UserRole, customUsername?: string) => Promise<boolean>;
  signInWithGoogle: (requestedRole?: UserRole, customUsername?: string) => Promise<boolean>;
  signOut: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateUsername: (newUsername: string) => { success: boolean; error?: string };
  notifications: PlatformNotification[];
  unreadNotifsCount: number;
  markNotificationsAsRead: () => void;
  bookmarks: string[];
  toggleBookmark: (seriesId: string) => boolean;
  followedCreators: string[];
  toggleFollowCreator: (creatorId: string) => boolean;
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
  const [followedCreators, setFollowedCreators] = useState<string[]>(() =>
    StorageService.getFollowedCreators(user.id)
  );

  useEffect(() => {
    setNotifications(StorageService.getNotifications(user.id));
    setBookmarks(StorageService.getBookmarks(user.id));
    setFollowedCreators(StorageService.getFollowedCreators(user.id));
  }, [user.id]);

  const canAccessAdmin = user.role === 'admin';
  const canAccessCreator = user.role === 'creator' || user.role === 'admin';
  const canAccessVIP = user.isVIP || user.role === 'subscriber' || user.role === 'admin';

  const hasPerm = (perm: Permission): boolean => {
    return hasPermission(user, perm);
  };

  const switchUserRole = (targetRole: UserRole) => {
    const allUsers = StorageService.getUsers();
    let target = allUsers.find(u => u.role === targetRole);
    if (!target) {
      const generatedUsername = `${targetRole}_${Math.floor(Math.random() * 900 + 100)}`;
      target = {
        id: `user_${targetRole}_${Date.now()}`,
        name: `MangaWild ${targetRole.replace('_', ' ').toUpperCase()}`,
        username: generatedUsername,
        email: `${targetRole}@mangawild.online`,
        role: targetRole,
        isVIP: targetRole === 'admin' || targetRole === 'subscriber',
        createdAt: new Date().toISOString(),
      };
      allUsers.push(target);
      StorageService.saveUsers(allUsers);
    }
    setUser(target);
    StorageService.setCurrentUser(target);
    setIsAuthenticated(target.id !== 'guest_reader' && Boolean(target.email));
  };

  const signIn = async (email: string, _pass?: string, requestedRole?: UserRole): Promise<boolean> => {
    const allUsers = StorageService.getUsers();
    let found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Check if admin email
    const isAdminEmail = email.toLowerCase() === 'huntsmp51@gmail.com' || email.toLowerCase().includes('admin');
    const assignedRole = requestedRole || (isAdminEmail ? 'admin' : 'free_user');

    if (!found) {
      const defaultUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      found = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        username: defaultUsername,
        email,
        role: assignedRole,
        isVIP: assignedRole === 'admin' || assignedRole === 'subscriber',
        createdAt: new Date().toISOString(),
      };
      allUsers.push(found);
      StorageService.saveUsers(allUsers);
    } else if (requestedRole && found.role !== requestedRole && found.role !== 'admin') {
      // Update role if explicitly requested (e.g. reader chooses creator)
      found.role = requestedRole;
      if (requestedRole === 'creator' && !found.creatorProfileId) {
        // Provision creator profile
        const creatorId = `creator_${Date.now()}`;
        found.creatorProfileId = creatorId;
        const creators = StorageService.getCreators();
        creators.push({
          id: creatorId,
          userId: found.id,
          penName: found.name,
          handle: `@${found.username}`,
          bio: 'Original Manga Creator publishing on MangaWild.',
          avatarUrl: found.avatarUrl || '/avatars/creator.svg',
          followersCount: 0,
          seriesCount: 0,
          totalReads: 0,
          monthlyEarningsInr: 0,
          revenueSharePercent: 70,
          upiId: '',
          bankAccountHolder: found.name,
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
    name: string,
    email: string,
    _pass?: string,
    requestedRole: UserRole = 'free_user',
    customUsername?: string
  ): Promise<boolean> => {
    const allUsers = StorageService.getUsers();
    
    // Sanitize username
    let cleanUsername = (customUsername || name.replace(/\s+/g, '_')).toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanUsername) cleanUsername = `reader_${Math.floor(Math.random() * 9000 + 1000)}`;

    const isCreatorRole = requestedRole === 'creator';
    const creatorId = isCreatorRole ? `creator_${Date.now()}` : undefined;

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      username: cleanUsername,
      email,
      role: requestedRole,
      isVIP: requestedRole === 'subscriber' || requestedRole === 'admin',
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
        penName: name,
        handle: `@${cleanUsername}`,
        bio: 'Original Manga Creator publishing on MangaWild.',
        avatarUrl: '/avatars/creator.svg',
        followersCount: 0,
        seriesCount: 0,
        totalReads: 0,
        monthlyEarningsInr: 0,
        revenueSharePercent: 70,
        upiId: '',
        bankAccountHolder: name,
        verified: false,
        joinedAt: new Date().toISOString().split('T')[0],
      });
      StorageService.saveCreators(creators);
    }

    setUser(newUser);
    StorageService.setCurrentUser(newUser);
    setIsAuthenticated(true);
    return true;
  };

  const signInWithGoogle = async (requestedRole: UserRole = 'free_user', customUsername?: string): Promise<boolean> => {
    try {
      const result = await signInWithGooglePopup();
      const fbUser = result.user;
      if (!fbUser.email) return false;

      const allUsers = StorageService.getUsers();
      let found = allUsers.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());

      const isAdminEmail = fbUser.email.toLowerCase() === 'huntsmp51@gmail.com';
      const assignedRole = isAdminEmail ? 'admin' : requestedRole;

      if (!found) {
        const username = customUsername || fbUser.displayName?.replace(/\s+/g, '_').toLowerCase() || fbUser.email.split('@')[0];
        const isCreatorRole = assignedRole === 'creator';
        const creatorId = isCreatorRole ? `creator_${Date.now()}` : undefined;

        found = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Manga Reader',
          username: username.replace(/[^a-zA-Z0-9_]/g, ''),
          email: fbUser.email,
          avatarUrl: fbUser.photoURL || undefined,
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
            bio: 'Original Manga Artist on MangaWild',
            avatarUrl: found.avatarUrl || '',
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

      setUser(found);
      StorageService.setCurrentUser(found);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.warn('Google sign-in popup cancelled or error:', err);
      return false;
    }
  };

  const signOut = () => {
    signOutFirebase().catch(() => {});
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
    const clean = newUsername.trim().replace(/^@/, '').toLowerCase();
    if (!clean || clean.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      return { success: false, error: 'Username can only contain letters, numbers, and underscores.' };
    }
    // Check uniqueness among other users
    const allUsers = StorageService.getUsers();
    const existing = allUsers.find(u => u.id !== user.id && u.username?.toLowerCase() === clean);
    if (existing) {
      return { success: false, error: 'This username is already taken. Please choose another.' };
    }

    const updatedUser = { ...user, username: clean };
    setUser(updatedUser);
    StorageService.setCurrentUser(updatedUser);

    // If user has creator profile, also sync their handle
    if (user.creatorProfileId) {
      const creators = StorageService.getCreators();
      const cIdx = creators.findIndex(c => c.id === user.creatorProfileId);
      if (cIdx >= 0) {
        creators[cIdx].handle = `@${clean}`;
        StorageService.saveCreators(creators);
      }
    }

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

  const toggleFollowCreator = (creatorId: string): boolean => {
    const followed = StorageService.toggleFollowCreator(user.id, creatorId);
    setFollowedCreators(StorageService.getFollowedCreators(user.id));
    return followed;
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        role: user.role,
        isVIP: user.isVIP,
        isAuthenticated,
        canAccessAdmin,
        canAccessCreator,
        canAccessVIP,
        hasPerm,
        switchUserRole,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateUser,
        updateUsername,
        notifications,
        unreadNotifsCount,
        markNotificationsAsRead,
        bookmarks,
        toggleBookmark,
        followedCreators,
        toggleFollowCreator,
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
