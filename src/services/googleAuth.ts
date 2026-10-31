/**
 * Google OAuth 2.0 Client Authentication Service
 * Uses Google Identity Services (GIS) OAuth 2.0 Token Client with UserInfo API
 */

import firebaseConfig from '../../firebase-applet-config.json';
import { signInWithGooglePopup } from './firebase';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  verifiedEmail?: boolean;
}

export const PRIMARY_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '724500297939-u49ujc9i5m7g4o612l6gehv64r17qfoc.apps.googleusercontent.com';

// Pre-authorized fallback client ID for this AI Studio Cloud project
export const PROJECT_CLIENT_ID =
  firebaseConfig.oAuthClientId ||
  '724500297939-u49ujc9i5m7g4o612l6gehv64r17qfoc.apps.googleusercontent.com';

export const GOOGLE_CLIENT_ID = PRIMARY_CLIENT_ID;

export function getCurrentAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://devoc.mangawild.online';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

/**
 * Ensures Google Identity Services client script is loaded
 */
export function ensureGoogleScriptLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')));
      // In case it already loaded
      if (window.google?.accounts?.oauth2) {
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google OAuth Identity Services'));
    document.head.appendChild(script);
  });
}

// Preload the Google Identity Services script in browser so popups open synchronously on user click
if (typeof window !== 'undefined') {
  ensureGoogleScriptLoaded().catch(() => {});
}

/**
 * Executes Google OAuth 2.0 flow using the configured Google OAuth Client ID
 * (724500297939-u49ujc9i5m7g4o612l6gehv64r17qfoc.apps.googleusercontent.com),
 * with automatic fallback to Firebase Google Auth Popup if needed.
 */
export async function authenticateWithGoogleOAuth(clientIdToUse?: string): Promise<GoogleUserProfile> {
  await ensureGoogleScriptLoaded().catch(() => {});

  const activeClientId = clientIdToUse || PRIMARY_CLIENT_ID;

  // Strategy 1: Google Identity Services (GIS) OAuth 2.0 Token Client using the configured Client ID
  if (window.google?.accounts?.oauth2) {
    try {
      const profile = await new Promise<GoogleUserProfile>((resolve, reject) => {
        try {
          const tokenClient = window.google!.accounts.oauth2.initTokenClient({
            client_id: activeClientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                const desc = tokenResponse.error_description || tokenResponse.error;
                reject(new Error(desc));
                return;
              }

              if (!tokenResponse.access_token) {
                reject(new Error('No access token returned from Google'));
                return;
              }

              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                  },
                });

                if (!res.ok) {
                  throw new Error(`Google UserInfo request failed with status ${res.status}`);
                }

                const data = await res.json();
                if (!data.email) {
                  throw new Error('Google account did not return an email address');
                }

                resolve({
                  id: data.sub || `google_${Date.now()}`,
                  email: data.email,
                  name: data.name || data.given_name || data.email.split('@')[0],
                  avatarUrl: data.picture,
                  verifiedEmail: Boolean(data.email_verified),
                });
              } catch (fetchErr: any) {
                reject(new Error(fetchErr?.message || 'Failed to fetch Google profile information'));
              }
            },
            error_callback: (err) => {
              const msg = err?.message || err?.type || '';
              if (msg.includes('popup_closed')) {
                reject(new Error('POPUP_CLOSED_BY_USER'));
              } else {
                reject(new Error(msg || 'Google OAuth authentication failed'));
              }
            },
          });

          tokenClient.requestAccessToken({ prompt: 'select_account' });
        } catch (err: any) {
          reject(err);
        }
      });

      return profile;
    } catch (gisErr: any) {
      if (gisErr?.message === 'POPUP_CLOSED_BY_USER') {
        throw new Error('Google sign-in popup was closed before completing.');
      }
      console.warn('GIS Token Client fallback to Firebase Auth Popup:', gisErr);
    }
  }

  // Strategy 2: Fallback to Firebase Google Auth Popup
  try {
    const cred = await signInWithGooglePopup();
    if (cred.user && cred.user.email) {
      return {
        id: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || cred.user.email.split('@')[0],
        avatarUrl: cred.user.photoURL || undefined,
        verifiedEmail: Boolean(cred.user.emailVerified),
      };
    }
  } catch (fbErr: any) {
    if (fbErr?.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completing.');
    }
    throw new Error(
      fbErr?.message ||
        `Google OAuth 2.0 error: Please ensure ${window.location.origin} is added to Authorized JavaScript Origins in Google Cloud Console.`
    );
  }

  throw new Error('Google authentication could not be completed.');
}
