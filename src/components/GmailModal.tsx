import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { GmailService, GmailMessageSummary, GmailUserProfile } from '../services/gmailService';
import { useAuth } from '../context/AuthContext';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
}

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  initialRecipient = '',
  initialSubject = '',
  initialBody = '',
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'compose' | 'inbox'>('compose');
  const [profile, setProfile] = useState<GmailUserProfile | null>(null);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [recipient, setRecipient] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [bodyText, setBodyText] = useState(initialBody);

  // Mandatory Confirmation Dialog State
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialRecipient) setRecipient(initialRecipient);
      if (initialSubject) setSubject(initialSubject);
      if (initialBody) setBodyText(initialBody);
      checkConnectionAndLoad();
    }
  }, [isOpen, initialRecipient, initialSubject, initialBody]);

  const checkConnectionAndLoad = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const p = await GmailService.getProfile();
      setProfile(p);
      const msgs = await GmailService.listMessages('', 8);
      setMessages(msgs);
    } catch (err: any) {
      console.warn('Gmail not yet connected or needs authorization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await GmailService.authenticateGmail();
      await checkConnectionAndLoad();
      setStatusMessage({ type: 'success', text: 'Successfully authenticated with your Gmail account!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to authenticate with Gmail.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !bodyText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in recipient email, subject, and message.' });
      return;
    }
    // Open mandatory confirmation dialog before sending
    setShowSendConfirmation(true);
  };

  const executeConfirmedSend = async () => {
    setShowSendConfirmation(false);
    setIsSending(true);
    setStatusMessage(null);

    try {
      // Format HTML email nicely
      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
          <div style="margin-bottom: 16px; border-bottom: 2px solid #6366f1; padding-bottom: 12px;">
            <h2 style="margin: 0; color: #4f46e5; font-size: 20px; letter-spacing: -0.5px;">MangaWild Dispatch</h2>
            <p style="margin: 4px 0 0 0; color: #718096; font-size: 12px;">Sent from MangaWild Online Publishing Ecosystem</p>
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #2d3748; white-space: pre-wrap;">
${bodyText}
          </div>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #edf2f7; font-size: 11px; color: #a0aec0; text-align: center;">
            <p style="margin: 0;">Sent via authorized Gmail integration by <strong>${user.name || user.email}</strong>.</p>
          </div>
        </div>
      `;

      await GmailService.sendEmail({
        to: recipient.trim(),
        subject: subject.trim(),
        bodyText: htmlBody,
        isHtml: true,
      });

      setStatusMessage({ type: 'success', text: `Email successfully sent to ${recipient.trim()} via Gmail!` });
      setRecipient('');
      setSubject('');
      setBodyText('');
      setTimeout(() => {
        checkConnectionAndLoad();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Error occurred while sending email through Gmail.' });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d0f17] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Gmail Workspace Hub</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {profile ? `Connected: ${profile.emailAddress}` : 'Send manga updates and manage emails via Gmail'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-zinc-800/80 bg-zinc-900/30">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('compose')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'compose'
                  ? 'border-red-500 text-white font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose & Share</span>
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'inbox'
                  ? 'border-red-500 text-white font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Recent Messages</span>
              {messages.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
                  {messages.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={checkConnectionAndLoad}
            disabled={isLoading}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh Gmail"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border border-red-800 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="leading-tight">{statusMessage.text}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          {!profile && !isLoading && (
            <div className="p-4 mb-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
              <Mail className="w-8 h-8 text-red-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">Connect Your Google Account</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Authorize MangaWild to interact with your Gmail with permission. You can send manga recommendations and view dispatches directly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnect}
                className="px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Authorize Gmail with Google</span>
              </button>
            </div>
          )}

          {activeTab === 'compose' ? (
            <form onSubmit={handleTriggerSend} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="friend@example.com or editor@publication.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Check out this manga on MangaWild!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Message Content
                </label>
                <textarea
                  rows={6}
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  placeholder="Hey, I just read this awesome manga chapter on MangaWild and thought you'd love it..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-sans"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">
                  Sends directly from your verified Gmail address
                </span>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-950 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Review & Send'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-mono">
                  {profile ? `Total threads: ${profile.threadsTotal}` : 'Messages'}
                </span>
                <span className="text-[11px] text-zinc-500">Live Gmail Feed</span>
              </div>

              {messages.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-zinc-600" />
                  <p>No recent messages found or Gmail not yet authorized.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col gap-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[280px]">
                          {msg.from}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-200 truncate">
                        {msg.subject}
                      </p>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">
                        {msg.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mandatory Confirmation Modal for Outgoing Gmail Send */}
        {showSendConfirmation && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#131722] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-600/50 text-red-400 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Outgoing Email Dispatch</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  You are about to send an email through your connected Google Workspace Gmail account to:
                </p>
                <div className="mt-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 truncate">
                  {recipient}
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Subject: <strong>{subject}</strong>
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendConfirmation(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedSend}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-red-950 transition-all active:scale-95"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
