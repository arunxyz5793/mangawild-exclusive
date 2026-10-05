/**
 * Gmail REST API Integration Service
 * Uses Google Workspace OAuth2 Access Token obtained via Firebase GoogleAuthProvider
 */

import { auth, googleProvider, signInWithPopup } from './firebase';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
  unread?: boolean;
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}

// In-memory token cache (NEVER stored in localStorage or sessionStorage per Workspace Guidelines)
let inMemoryAccessToken: string | null = null;

export const GmailService = {
  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  clearAccessToken(): void {
    inMemoryAccessToken = null;
  },

  /**
   * Prompts user with Google OAuth popup requesting Gmail scopes
   */
  async authenticateGmail(): Promise<string> {
    try {
      // Ensure desired scopes are requested
      googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
      googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      googleProvider.addScope('https://www.googleapis.com/auth/gmail.modify');
      googleProvider.addScope('https://www.googleapis.com/auth/gmail.compose');

      const result = await signInWithPopup(auth, googleProvider);
      // Retrieve credential
      const credential = (result as any)._tokenResponse?.oauthAccessToken ||
        (result as any).credential?.accessToken;

      if (credential) {
        inMemoryAccessToken = credential;
        return credential;
      }

      // If token not in private field, inspect GoogleAuthProvider credential
      const { GoogleAuthProvider } = await import('firebase/auth');
      const authCred = GoogleAuthProvider.credentialFromResult(result);
      if (authCred?.accessToken) {
        inMemoryAccessToken = authCred.accessToken;
        return authCred.accessToken;
      }

      throw new Error('Could not retrieve Gmail OAuth access token.');
    } catch (err: any) {
      console.error('Gmail authentication error:', err);
      throw err;
    }
  },

  async ensureToken(): Promise<string> {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    return await this.authenticateGmail();
  },

  /**
   * Fetches user Gmail profile info
   */
  async getProfile(): Promise<GmailUserProfile> {
    const token = await this.ensureToken();
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 401) {
        inMemoryAccessToken = null;
      }
      throw new Error(`Gmail API error (${res.status}): ${err}`);
    }

    return await res.json();
  },

  /**
   * Lists recent messages
   */
  async listMessages(query: string = '', maxResults: number = 10): Promise<GmailMessageSummary[]> {
    const token = await this.ensureToken();
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('maxResults', maxResults.toString());
    if (query) {
      url.searchParams.set('q', query);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) inMemoryAccessToken = null;
      throw new Error(`Failed to list Gmail messages: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.messages || !Array.isArray(data.messages)) {
      return [];
    }

    // Fetch message details in parallel
    const details = await Promise.all(
      data.messages.slice(0, 10).map(async (m: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!detailRes.ok) return { id: m.id, threadId: m.threadId };
          const detailData = await detailRes.json();
          const headers = detailData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          const unread = detailData.labelIds?.includes('UNREAD');

          return {
            id: m.id,
            threadId: m.threadId,
            snippet: detailData.snippet || '',
            subject,
            from,
            date,
            unread,
          };
        } catch {
          return { id: m.id, threadId: m.threadId };
        }
      })
    );

    return details;
  },

  /**
   * Sends an email via Gmail REST API
   * NOTE: Per Google Workspace Skill Guidelines, destructive / outgoing operations
   * MUST have explicit user confirmation in the UI before this function is called.
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    bodyText: string;
    isHtml?: boolean;
  }): Promise<{ id: string; threadId: string }> {
    const token = await this.ensureToken();

    // Construct RFC 2822 email message
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`;
    const messageParts = [
      `To: ${options.to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      options.bodyText,
    ];
    const rawMessage = messageParts.join('\r\n');

    // Base64url encode
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!res.ok) {
      if (res.status === 401) inMemoryAccessToken = null;
      const errorText = await res.text();
      throw new Error(`Failed to send email via Gmail: ${errorText}`);
    }

    return await res.json();
  },
};
