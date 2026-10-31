import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Copy, Share2, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text?: string;
  url?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  text,
  url,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || `${title} on MangaWild`;

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const copyToClipboard = async (customNotice?: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (customNotice) {
        setStatusMessage(customNotice);
      } else {
        setStatusMessage('Link copied to clipboard');
      }
      setTimeout(() => {
        setCopied(false);
        setStatusMessage(null);
      }, 2600);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setStatusMessage(customNotice || 'Link copied to clipboard');
      setTimeout(() => {
        setCopied(false);
        setStatusMessage(null);
      }, 2600);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await copyToClipboard('Link copied! Paste in any app to share.');
    }
  };

  const platforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      onClick: () => {
        const target = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        window.location.href = target;
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      onClick: async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({ title, text: shareText, url: shareUrl });
            return;
          } catch {
            // Fallback to copy
          }
        }
        await copyToClipboard('Link copied! Paste in Instagram Story or DM.');
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="url(#mw-ig-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="mw-ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FD5949" />
              <stop offset="50%" stopColor="#D6249F" />
              <stop offset="100%" stopColor="#285AEB" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#D6249F" strokeWidth="2.5" />
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      onClick: () => {
        const target = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.location.href = target;
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      onClick: () => {
        const target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.location.href = target;
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      id: 'telegram',
      name: 'Telegram',
      onClick: () => {
        const target = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.location.href = target;
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#26A5E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      ),
    },
    {
      id: 'discord',
      name: 'Discord',
      onClick: async () => {
        await copyToClipboard('Link copied! Paste directly in Discord.');
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      id: 'reddit',
      name: 'Reddit',
      onClick: () => {
        const target = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
        window.location.href = target;
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#FF4500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="14" r="7" />
          <circle cx="9.5" cy="13" r="1" fill="#FF4500" />
          <circle cx="14.5" cy="13" r="1" fill="#FF4500" />
          <path d="M9.5 16.5c1.5 1 3.5 1 5 0" />
          <path d="M12 7V4l4 1" />
          <circle cx="17.5" cy="5.5" r="1.5" />
        </svg>
      ),
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      onClick: async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({ title, text: shareText, url: shareUrl });
            return;
          } catch {
            // Fallback
          }
        }
        await copyToClipboard('Link copied! Paste in Snapchat.');
      },
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FFFC00" stroke="#D9B600" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c-3.2 0-5.5 2.4-5.5 5.8 0 1.2.2 2.2.2 2.2l-1.5.6c-.4.2-.5.7-.2 1 .4.4 1.2.7 1.7.9-.3 1.4-1.3 2.5-2.7 3-.4.1-.5.6-.2.9.8.7 2.2 1.1 3.5 1.2.4.8 1.1 1.4 2.2 1.4 1 0 1.7-.4 2.5-.4s1.5.4 2.5.4c1.1 0 1.8-.6 2.2-1.4 1.3-.1 2.7-.5 3.5-1.2.3-.3.2-.8-.2-.9-1.4-.5-2.4-1.6-2.7-3 .5-.2 1.3-.5 1.7-.9.3-.3.2-.8-.2-1l-1.5-.6s.2-1 .2-2.2C17.5 5.4 15.2 3 12 3z" />
        </svg>
      ),
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all box-border ${
          isLight
            ? 'bg-white text-black border-black'
            : 'bg-black text-white border-white/25'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-current/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-wider truncate">
                Share
              </h3>
              <p className="text-[11px] opacity-70 truncate">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
              isLight
                ? 'border-black/20 hover:bg-black hover:text-white'
                : 'border-white/20 hover:bg-white hover:text-black'
            }`}
            aria-label="Close share dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Social Platforms Grid */}
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2.5">
            Share to Social Media
          </p>
          <div className="grid grid-cols-4 gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={p.onClick}
                className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all active:scale-95 ${
                  isLight
                    ? 'border-black/20 hover:border-black hover:bg-black hover:text-white'
                    : 'border-white/15 hover:border-white hover:bg-white hover:text-black'
                }`}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  {p.icon}
                </div>
                <span className="text-[10px] font-bold tracking-tight truncate w-full text-center">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link Bar */}
        <div className="mt-4 pt-4 border-t border-current/15">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">
            Direct Link
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                isLight
                  ? 'bg-white text-black border-black/30'
                  : 'bg-black text-white border-white/20'
              }`}
            />
            <button
              type="button"
              onClick={() => copyToClipboard()}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border shrink-0 transition-all ${
                copied
                  ? isLight
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-white'
                  : isLight
                  ? 'border-black hover:bg-black hover:text-white'
                  : 'border-white hover:bg-white hover:text-black'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          {statusMessage && (
            <p className="mt-2 text-[11px] font-bold text-center opacity-90">
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
