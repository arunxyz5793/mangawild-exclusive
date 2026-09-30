/**
 * Google OAuth 2.0 Client Authentication Service
 * Uses Google Identity Services (GIS) OAuth 2.0 Token Client with UserInfo API
 */

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  verifiedEmail?: boolean;
}

export const PRIMARY_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '886153338264-vjncm4kb9ngu3f41oefljv337lsrfvur.apps.googleusercontent.com';

// Pre-authorized fallback client ID for this AI Studio Cloud project
export const PROJECT_CLIENT_ID =
  '682818552453-if2oljiquqtm5c1cen8l7608606sqgin.apps.googleusercontent.com';

export const GOOGLE_CLIENT_ID = PRIMARY_CLIENT_ID;

export function getCurrentAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://ais-dev-xa6ob5qbsyhfdunbq3bikm-635034702616.asia-east1.run.app';
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

/**
 * Executes Google OAuth 2.0 flow via GIS Token Client popup
 * and fetches the authenticated user profile from Google UserInfo
 */
export async function authenticateWithGoogleOAuth(clientIdToUse?: string): Promise<GoogleUserProfile> {
  await ensureGoogleScriptLoaded();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK is unavailable');
  }

  const activeClientId = clientIdToUse || PRIMARY_CLIENT_ID;

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('No access token returned from Google'));
            return;
          }

          try {
            // Fetch user info from Google's OpenID / UserInfo endpoint
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

            const profile: GoogleUserProfile = {
              id: data.sub || `google_${Date.now()}`,
              email: data.email,
              name: data.name || data.given_name || data.email.split('@')[0],
              avatarUrl: data.picture,
              verifiedEmail: Boolean(data.email_verified),
            };

            resolve(profile);
          } catch (fetchErr: any) {
            reject(new Error(fetchErr?.message || 'Failed to fetch Google profile information'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Google OAuth authentication failed'));
        },
      });

      // Open the Google OAuth consent popup
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(err);
    }
  });
}
