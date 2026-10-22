import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

if (typeof window !== 'undefined') {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying the firestoreDatabaseId
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-mangawild-6c426fc8-997a-4201-b9d3-84c8cedea66e'
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on startup
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testFirestoreConnection();

export async function signInWithGooglePopup() {
  return await signInWithPopup(auth, googleProvider);
}

/**
 * Request Firebase to send a secure password reset email
 */
export async function sendFirebasePasswordReset(email: string): Promise<{ success: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  const actionCodeSettings = typeof window !== 'undefined' && window.location ? {
    url: `${window.location.origin}?mode=resetPassword`,
    handleCodeInApp: true,
  } : undefined;

  try {
    if (actionCodeSettings) {
      await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
    } else {
      await sendPasswordResetEmail(auth, cleanEmail);
    }
    return { success: true };
  } catch (error: any) {
    console.warn('Firebase sendPasswordResetEmail error:', error);
    const code = error?.code || '';

    // If account does not exist yet in Firebase Auth, provision it and retry
    if (code === 'auth/user-not-found') {
      try {
        const tempPassword = 'MW_' + Math.random().toString(36).substring(2, 10) + '!Aa1';
        await createUserWithEmailAndPassword(auth, cleanEmail, tempPassword);
        if (actionCodeSettings) {
          await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
        } else {
          await sendPasswordResetEmail(auth, cleanEmail);
        }
        return { success: true };
      } catch (createErr: any) {
        console.warn('Firebase auto-create user error:', createErr);
        if (createErr?.code === 'auth/email-already-in-use') {
          await sendPasswordResetEmail(auth, cleanEmail);
          return { success: true };
        }
      }
    }

    if (code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (code === 'auth/user-not-found') {
      throw new Error('No account found with this email in Firebase. Please check your email or create an account.');
    } else if (code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait 1-2 minutes before requesting another code.');
    } else if (code === 'auth/unauthorized-continue-uri') {
      // Fallback without actionCodeSettings
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } else if (
      code.includes('app-check') ||
      code.includes('appcheck') ||
      error?.message?.toLowerCase().includes('app-check') ||
      error?.message?.toLowerCase().includes('appcheck')
    ) {
      throw new Error(
        'Firebase App Check error: Firebase Console mein App Check -> APIs -> Authentication ko "Unenforce" karein taaki Firebase verification emails allow kar sake.'
      );
    } else if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Firebase Console -> Authentication -> Sign-in method mein "Email/Password" ko Enable karein.'
      );
    }

    throw new Error(error?.message || 'Failed to dispatch password reset email via Firebase.');
  }
}

/**
 * Verify and apply password reset with code sent by Firebase
 */
export async function confirmFirebasePasswordReset(code: string, newPassword: string): Promise<boolean> {
  try {
    await confirmPasswordReset(auth, code.trim(), newPassword);
    return true;
  } catch (error: any) {
    console.warn('Firebase confirmPasswordReset error:', error);
    const errCode = error?.code || '';
    if (errCode === 'auth/invalid-action-code') {
      throw new Error('Invalid verification code. Please check the code received in your email.');
    } else if (errCode === 'auth/expired-action-code') {
      throw new Error('Verification code has expired. Please request a new code.');
    } else if (errCode === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    }
    throw error;
  }
}

export {
  signInWithPopup,
  fbSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  createUserWithEmailAndPassword,
};

