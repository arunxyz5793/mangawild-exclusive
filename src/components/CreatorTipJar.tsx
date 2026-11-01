import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart,
  Sparkles,
  CheckCircle2,
  Send,
  X,
  CreditCard,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { CreatorProfile, CreatorTip } from '../types/manga';
import { launchRazorpayTipCheckout } from '../services/razorpay';
import { getAvatarUrl } from '../utils/avatar';

interface CreatorTipJarProps {
  creatorId?: string;
  creatorName: string;
  seriesId?: string;
  seriesTitle?: string;
  chapterNumber?: number;
  variant?: 'inline' | 'compact';
  directForm?: boolean;
  isModalOpen?: boolean;
  anchorY?: number | null;
  onClose?: () => void;
  onTipSent?: () => void;
  onTipSuccess?: (tip: CreatorTip, updatedCreator: CreatorProfile | null) => void;
}

const INR_TIP_PRESETS = [
  { amountInr: 20 },
  { amountInr: 50 },
  { amountInr: 100 },
  { amountInr: 200 },
  { amountInr: 500 },
];

interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  rotation: number;
  type: 'dot' | 'ring' | 'spark' | 'line';
  duration: number;
}

export const CreatorTipJar: React.FC<CreatorTipJarProps> = ({
  creatorId,
  creatorName,
  seriesId,
  seriesTitle,
  chapterNumber,
  variant = 'inline',
  directForm = false,
  isModalOpen,
  anchorY,
  onClose,
  onTipSent,
  onTipSuccess,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedInr, setSelectedInr] = useState<number>(50);
  const [customInr, setCustomInr] = useState<string>('');
  const [note, setNote] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [internalAnchorY, setInternalAnchorY] = useState<number | null>(null);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdCounter = useRef(0);

  const effectiveModalOpen = isModalOpen !== undefined ? isModalOpen : internalModalOpen;
  const effectiveAnchorY = anchorY !== undefined ? anchorY : internalAnchorY;

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (onClose) onClose();
  };

  const creator =
    (creatorId ? StorageService.getCreatorById(creatorId) : undefined) ||
    StorageService.getCreatorByAuthorName(creatorName);

  // Lock background scroll in place without jumping scroll position when modal is open
  useEffect(() => {
    if (!effectiveModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveModalOpen]);

  const triggerMonochromeParticles = useCallback(() => {
    const count = 22;
    const newParticles: Particle[] = [];
    const types: Particle['type'][] = ['dot', 'ring', 'spark', 'line'];

    for (let i = 0; i < count; i++) {
      particleIdCounter.current += 1;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const distance = 36 + Math.random() * 68;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 18;
      const size = 3 + Math.random() * 5;
      const rotation = Math.random() * 360;
      const type = types[i % types.length];
      const duration = 650 + Math.random() * 350;

      newParticles.push({
        id: particleIdCounter.current,
        dx,
        dy,
        size,
        rotation,
        type,
        duration,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.some((np) => np.id === p.id))
      );
    }, 1050);
  }, []);

  const renderParticleLayer = () => (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-30">
      {particles.map((p) => (
        <span
          key={p.id}
          style={
            {
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--rot': `${p.rotation}deg`,
              '--dur': `${p.duration}ms`,
              width: p.type === 'line' ? `${p.size * 2.2}px` : `${p.size}px`,
              height: p.type === 'line' ? '1.5px' : `${p.size}px`,
            } as React.CSSProperties
          }
          className={`
            absolute animate-fade-out
            ${p.type === 'dot' ? (isLight ? 'rounded-full bg-black' : 'rounded-full bg-white') : ''}
            ${p.type === 'ring' ? (isLight ? 'rounded-full border border-black bg-transparent' : 'rounded-full border border-white bg-transparent') : ''}
            ${p.type === 'spark' ? (isLight ? 'rotate-45 bg-black' : 'rotate-45 bg-white') : ''}
            ${p.type === 'line' ? (isLight ? 'rounded-full bg-black' : 'rounded-full bg-white') : ''}
          `}
        />
      ))}
    </span>
  );

  const handleRazorpayTip = async () => {
    triggerMonochromeParticles();
    setStatusMessage(null);

    const amountInr = customInr ? parseInt(customInr, 10) : selectedInr;
    if (!amountInr || isNaN(amountInr) || amountInr < 10) {
      setStatusMessage({
        type: 'error',
        text: 'Minimum tip amount via Razorpay is ₹10.',
      });
      return;
    }

    setIsProcessingRazorpay(true);
    const effectiveCreatorId =
      creator?.id ||
      creatorId ||
      `creator_${creatorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    await launchRazorpayTipCheckout({
      amountInr,
      creatorName,
      creatorId: effectiveCreatorId,
      seriesTitle,
      user,
      message: note.trim() || `Supported ₹${amountInr} via Razorpay!`,
      onSuccess: (paymentId) => {
        const tipRecord = StorageService.addTip({
          creatorId: effectiveCreatorId,
          seriesId,
          seriesTitle,
          chapterNumber,
          userId: user?.id,
          supporterName: user?.name || 'MangaWild Reader',
          supporterAvatar: getAvatarUrl(user?.avatarUrl),
          coins: amountInr,
          amountInr,
          message: note.trim() || `Supported ₹${amountInr} via Razorpay!`,
        });

        setIsProcessingRazorpay(false);
        setStatusMessage({
          type: 'success',
          text: `Sent ₹${amountInr} tip to ${creatorName}! (Ref: ${paymentId})`,
        });
        setNote('');
        setCustomInr('');

        const updatedCreator = StorageService.getCreatorById(effectiveCreatorId) || null;
        if (onTipSuccess) {
          onTipSuccess(tipRecord, updatedCreator);
        }
        if (onTipSent) {
          setTimeout(() => {
            onTipSent();
          }, 900);
        }
      },
      onDismiss: () => {
        setIsProcessingRazorpay(false);
      },
      onError: (err) => {
        setIsProcessingRazorpay(false);
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Razorpay payment could not be completed.',
        });
      },
    });
  };

  // Compute exact vertical placement so the popup opens right where the viewer currently is
  const getPopupPositionStyle = (): React.CSSProperties => {
    if (typeof window === 'undefined') return {};
    const vpHeight = window.visualViewport?.height || window.innerHeight || 800;
    const cardEstimatedHeight = 420;
    if (typeof effectiveAnchorY === 'number' && !isNaN(effectiveAnchorY)) {
      const idealTop = effectiveAnchorY - cardEstimatedHeight / 2;
      const clampedTop = Math.max(16, Math.min(idealTop, Math.max(16, vpHeight - cardEstimatedHeight - 16)));
      return {
        position: 'fixed',
        top: `${Math.round(clampedTop)}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }
    return {};
  };

  const renderFormBody = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pr-8">
        <img
          src={getAvatarUrl(creator?.avatarUrl)}
          alt={creatorName}
          className={`w-11 h-11 rounded-xl object-cover border shrink-0 ${
            isLight ? 'border-black' : 'border-white/30'
          }`}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-black uppercase tracking-wider truncate">
              Support {creatorName}
            </h3>
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
          </div>
          <p className="text-[11px] opacity-75 truncate">
            100% direct ₹ INR support via Razorpay (UPI, GPay, Cards)
          </p>
        </div>
      </div>

      {/* INR Presets */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {INR_TIP_PRESETS.map((preset) => {
            const isSelected = !customInr && selectedInr === preset.amountInr;
            return (
              <button
                key={preset.amountInr}
                type="button"
                onClick={() => {
                  setSelectedInr(preset.amountInr);
                  setCustomInr('');
                }}
                className={`btn-interactive py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer box-border ${
                  isSelected
                    ? isLight
                      ? 'border-black bg-black text-white light-invert-pill'
                      : 'border-white bg-white text-black'
                    : isLight
                    ? 'border-black/25 bg-white text-black hover:border-black'
                    : 'border-white/20 bg-zinc-950 text-white hover:border-white'
                }`}
              >
                <div className="text-sm font-black font-mono">
                  ₹{preset.amountInr}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono opacity-80 shrink-0">
            Custom ₹:
          </span>
          <input
            type="number"
            min={10}
            max={50000}
            value={customInr}
            onChange={(e) => setCustomInr(e.target.value)}
            placeholder="Enter ₹ amount (min ₹10)"
            className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none box-border ${
              isLight
                ? 'bg-white border-black text-black'
                : 'bg-zinc-950 border-white/25 text-white focus:border-white'
            }`}
          />
        </div>
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Write a message for ${creatorName} (optional)...`}
        maxLength={120}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none box-border ${
          isLight
            ? 'bg-white border-black text-black'
            : 'bg-zinc-950 border-white/25 text-white focus:border-white'
        }`}
      />

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            isLight
              ? 'border-black bg-white text-black'
              : 'border-white/30 bg-zinc-950 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="break-words">{statusMessage.text}</span>
        </div>
      )}

      <button
        type="button"
        disabled={isProcessingRazorpay}
        onClick={handleRazorpayTip}
        className={`btn-interactive relative w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 box-border border ${
          isLight
            ? 'bg-black text-white border-black hover:bg-black/90 light-invert-pill'
            : 'bg-white text-black border-white hover:bg-white/90'
        }`}
      >
        {renderParticleLayer()}
        {isProcessingRazorpay ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Opening Razorpay...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Pay ₹{customInr || selectedInr} via Razorpay</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] opacity-65 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>UPI (GPay, PhonePe, Paytm), Cards & NetBanking</span>
      </div>
    </div>
  );

  // If controlled modal (`isModalOpen` prop provided)
  if (isModalOpen !== undefined) {
    if (!isModalOpen || typeof document === 'undefined') return null;
    const hasAnchor = typeof effectiveAnchorY === 'number' && !isNaN(effectiveAnchorY);
    return createPortal(
      <div
        className={`fixed inset-0 z-[99999] modal-backdrop-overlay bg-black/75 backdrop-blur-xs p-4 animate-fade-in box-border ${
          hasAnchor ? ' block' : 'flex items-center justify-center'
        }`}
        onClick={handleCloseModal}
      >
        <div
          style={hasAnchor ? getPopupPositionStyle() : undefined}
          className={`border rounded-2xl max-w-md w-[calc(100vw-2rem)] sm:w-full p-5 sm:p-6 shadow-2xl relative box-border max-h-[88vh] overflow-y-auto ${
            isLight
              ? 'bg-white text-black border-black'
              : 'bg-black text-white border-white/25'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCloseModal}
            className={`btn-interactive absolute top-4 right-4 p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'border-black/25 hover:bg-black hover:text-white'
                : 'border-white/20 hover:bg-white hover:text-black'
            }`}
            aria-label="Close Tip Modal"
          >
            <X className="w-4 h-4" />
          </button>
          {renderFormBody()}
        </div>
      </div>,
      document.body
    );
  }

  // If directForm (embedded inside an external modal wrapper)
  if (directForm) {
    return renderFormBody();
  }

  // Compact Button + Portaled Modal at Viewer's Exact Position
  if (variant === 'compact') {
    const hasAnchor = typeof effectiveAnchorY === 'number' && !isNaN(effectiveAnchorY);
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setInternalAnchorY(rect.top + rect.height / 2);
            triggerMonochromeParticles();
            setInternalModalOpen(true);
            setStatusMessage(null);
          }}
          className={`btn-interactive relative inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer max-w-full box-border ${
            isLight
              ? 'border-black bg-white text-black hover:bg-black hover:text-white'
              : 'border-white/25 bg-zinc-900 hover:bg-zinc-800 text-white'
          }`}
        >
          {renderParticleLayer()}
          <Heart className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Tip Creator</span>
        </button>

        {internalModalOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className={`fixed inset-0 z-[99999] modal-backdrop-overlay bg-black/75 backdrop-blur-xs p-4 animate-fade-in box-border ${
                hasAnchor ? 'block' : 'flex items-center justify-center'
              }`}
              onClick={handleCloseModal}
            >
              <div
                style={hasAnchor ? getPopupPositionStyle() : undefined}
                className={`border rounded-2xl max-w-md w-[calc(100vw-2rem)] sm:w-full p-5 sm:p-6 shadow-2xl relative box-border max-h-[88vh] overflow-y-auto ${
                  isLight
                    ? 'bg-white text-black border-black'
                    : 'bg-black text-white border-white/25'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`btn-interactive absolute top-4 right-4 p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isLight
                      ? 'border-black/25 hover:bg-black hover:text-white'
                      : 'border-white/20 hover:bg-white hover:text-black'
                  }`}
                  aria-label="Close Tip Modal"
                >
                  <X className="w-4 h-4" />
                </button>
                {renderFormBody()}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  // Inline Variant (Used at end of chapters right where the reader is)
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 w-full max-w-full box-border overflow-hidden ${
        isLight
          ? 'bg-white text-black border-black'
          : 'bg-zinc-950/90 text-white border-white/20'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={getAvatarUrl(creator?.avatarUrl)}
            alt={creatorName}
            className={`w-10 h-10 rounded-xl object-cover border shrink-0 ${
              isLight ? 'border-black' : 'border-white/25'
            }`}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-wider truncate">
              Support {creatorName}
            </h3>
            <p className="text-[11px] opacity-70 truncate">
              Direct Creator Tip in ₹ via Razorpay
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider ${
            isLight ? 'border-black text-black' : 'border-white/25 text-white'
          }`}
        >
          ₹ INR Razorpay
        </span>
      </div>

      {/* INR Presets */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {INR_TIP_PRESETS.map((preset) => {
          const isSelected = !customInr && selectedInr === preset.amountInr;
          return (
            <button
              key={preset.amountInr}
              type="button"
              onClick={() => {
                setSelectedInr(preset.amountInr);
                setCustomInr('');
              }}
              className={`btn-interactive py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer box-border ${
                isSelected
                  ? isLight
                    ? 'border-black bg-black text-white light-invert-pill'
                    : 'border-white bg-white text-black'
                  : isLight
                  ? 'border-black/25 bg-white text-black hover:border-black'
                  : 'border-white/15 bg-zinc-900 text-white hover:border-white'
              }`}
            >
              <div className="text-xs font-black font-mono">
                ₹{preset.amountInr}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-4 flex items-center gap-2">
          <span className="text-xs font-mono opacity-75 shrink-0">Custom ₹:</span>
          <input
            type="number"
            min={10}
            max={50000}
            value={customInr}
            onChange={(e) => setCustomInr(e.target.value)}
            placeholder="Min ₹10"
            className={`w-full min-w-0 px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none box-border ${
              isLight
                ? 'bg-white border-black/30 text-black focus:border-black'
                : 'bg-zinc-900 border-white/20 text-white focus:border-white'
            }`}
          />
        </div>

        <div className="sm:col-span-5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the creator..."
            maxLength={120}
            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none box-border ${
              isLight
                ? 'bg-white border-black/30 text-black focus:border-black'
                : 'bg-zinc-900 border-white/20 text-white focus:border-white'
            }`}
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="button"
            disabled={isProcessingRazorpay}
            onClick={handleRazorpayTip}
            className={`btn-interactive relative w-full h-full py-2 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 box-border border ${
              isLight
                ? 'bg-black text-white border-black hover:bg-black/90 light-invert-pill'
                : 'bg-white text-black border-white hover:bg-white/90'
            }`}
          >
            {renderParticleLayer()}
            {isProcessingRazorpay ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <Send className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">
              Tip ₹{customInr || selectedInr}
            </span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
            isLight
              ? 'border-black bg-white text-black'
              : 'border-white/30 bg-zinc-900 text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="break-words">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
