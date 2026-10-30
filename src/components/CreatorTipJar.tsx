import React, { useState } from 'react';
import { Coins, Send, X, CreditCard, ShieldCheck, CheckCircle2, Heart } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { launchRazorpayTipCheckout } from '../services/razorpay';

interface CreatorTipJarProps {
  creatorId: string;
  creatorName: string;
  seriesId?: string;
  seriesTitle?: string;
  chapterId?: string;
  chapterNumber?: number;
  onTipSent?: (coins: number, inr?: number) => void;
  compact?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  isBadge?: boolean;
  text?: string;
}

export const CreatorTipJar: React.FC<CreatorTipJarProps> = ({
  creatorId,
  creatorName,
  seriesId,
  seriesTitle,
  chapterId,
  chapterNumber,
  onTipSent,
  compact = false,
}) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [tipMethod, setTipMethod] = useState<'razorpay' | 'coins'>('razorpay');
  const [selectedInr, setSelectedInr] = useState<number>(50);
  const [customInr, setCustomInr] = useState<string>('50');
  const [tipMessage, setTipMessage] = useState<string>('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lastTippedText, setLastTippedText] = useState<string | null>(null);
  const [activeRipple, setActiveRipple] = useState(false);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subtle, elegant monochromatic particle explosion
  const triggerEtherealParticles = (badgeText: string) => {
    setActiveRipple(true);
    setTimeout(() => setActiveRipple(false), 800);

    const particleList: Particle[] = [
      // Central floating tip badge
      {
        id: Date.now(),
        x: 0,
        y: -42,
        size: 0,
        opacity: 1,
        duration: 1.2,
        delay: 0,
        isBadge: true,
        text: badgeText,
      },
      // Subtle surrounding ink & light particles
      ...Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const distance = Math.random() * 55 + 25;
        return {
          id: Date.now() + i + 1,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 25,
          size: Math.random() * 3 + 1.5,
          opacity: Math.random() * 0.7 + 0.3,
          duration: Math.random() * 0.6 + 0.8,
          delay: Math.random() * 0.1,
        };
      }),
    ];

    setParticles(particleList);
    setLastTippedText(badgeText);

    setTimeout(() => {
      setParticles([]);
    }, 1400);

    setTimeout(() => {
      setLastTippedText(null);
    }, 3500);
  };

  // 1. Direct Razorpay Gateway Flow (UPI, Cards, Netbanking)
  const handlePayViaRazorpay = async (amountInr: number) => {
    if (amountInr <= 0) return;
    setErrorMessage(null);
    setIsProcessingRazorpay(true);

    const success = await launchRazorpayTipCheckout({
      amountInr,
      creatorName,
      creatorId,
      seriesTitle,
      user,
      message: tipMessage,
      onSuccess: (paymentId: string) => {
        setIsProcessingRazorpay(false);
        const coinsEquivalent = Math.round(amountInr * 2);

        StorageService.addTip({
          creatorId,
          seriesId,
          seriesTitle,
          chapterId,
          chapterNumber,
          userId: user?.id,
          supporterName: user?.name || user?.username || 'Supporter Reader',
          supporterAvatar: user?.avatarUrl,
          coins: coinsEquivalent,
          amountInr,
          message: tipMessage.trim() || undefined,
        });

        triggerEtherealParticles(`₹${amountInr} Tipped via Razorpay`);
        onTipSent?.(coinsEquivalent, amountInr);
        setShowModal(false);
        setTipMessage('');
      },
      onDismiss: () => {
        setIsProcessingRazorpay(false);
      },
      onError: (err: any) => {
        console.warn('Razorpay tip error:', err);
        setIsProcessingRazorpay(false);
        setErrorMessage(err?.message || 'Payment cancelled or unavailable.');
      },
    });

    if (!success) {
      setIsProcessingRazorpay(false);
    }
  };

  // 2. Coin Tip Flow
  const handleSendCoins = (coins: number) => {
    if (coins <= 0) return;
    const amountInr = Math.round(coins * 0.5);

    StorageService.addTip({
      creatorId,
      seriesId,
      seriesTitle,
      chapterId,
      chapterNumber,
      userId: user?.id,
      supporterName: user?.name || user?.username || 'Supporter Reader',
      supporterAvatar: user?.avatarUrl,
      coins,
      amountInr,
      message: tipMessage.trim() || undefined,
    });

    triggerEtherealParticles(`+${coins} Coins Tipped`);
    onTipSent?.(coins, amountInr);
    setShowModal(false);
    setTipMessage('');
  };

  return (
    <div className="relative w-full max-w-full box-border">
      {/* Monochromatic Ethereal Particle Layer */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-40">
        {particles.map((p) => {
          if (p.isBadge) {
            return (
              <div
                key={p.id}
                style={{
                  transform: `translate(${p.x}px, ${p.y}px)`,
                  transition: `all ${p.duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
                }}
                className="absolute flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/95 border border-white/40 text-white font-mono text-xs font-bold shadow-[0_0_24px_rgba(255,255,255,0.2)] animate-fade-out whitespace-nowrap"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>{p.text}</span>
              </div>
            );
          }

          return (
            <span
              key={p.id}
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                transform: `translate(${p.x}px, ${p.y}px)`,
                transition: `all ${p.duration}s cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}s`,
                opacity: p.opacity,
              }}
              className="absolute rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] pointer-events-none animate-fade-out"
            />
          );
        })}
      </div>

      {/* Main Inline Card */}
      <div
        className={`relative w-full max-w-full box-border rounded-2xl bg-zinc-950/90 border border-white/[0.08] text-center p-4 sm:p-5 space-y-3 transition-all duration-300 ${
          activeRipple ? 'ring-2 ring-white/30 border-white/30 shadow-[0_0_24px_rgba(255,255,255,0.08)]' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs font-mono max-w-full box-border">
          <div className="flex items-center gap-1.5 text-zinc-200 font-bold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5 text-white" />
            <span>Tip Creator: {creatorName}</span>
          </div>
          {lastTippedText ? (
            <span className="text-[11px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20 animate-pulse">
              {lastTippedText}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 font-mono">UPI • Cards • Razorpay</span>
          )}
        </div>

        {/* Quick Tipping Buttons with Razorpay Action */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5 w-full max-w-full box-border">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInr(20);
              handlePayViaRazorpay(20);
            }}
            className="group relative flex-1 sm:flex-initial min-w-[70px] max-w-full box-border px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/[0.08] hover:border-white/30 hover:ring-1 hover:ring-white/20 text-xs font-mono font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
          >
            ₹20
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInr(50);
              handlePayViaRazorpay(50);
            }}
            className="group relative flex-1 sm:flex-initial min-w-[70px] max-w-full box-border px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/[0.08] hover:border-white/30 hover:ring-1 hover:ring-white/20 text-xs font-mono font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
          >
            ₹50
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInr(100);
              handlePayViaRazorpay(100);
            }}
            className="group relative flex-1 sm:flex-initial min-w-[76px] max-w-full box-border px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 hover:ring-2 hover:ring-white/40 font-mono text-xs font-black shadow-md transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            ₹100
          </button>

          {/* Primary Razorpay Modal Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="flex-1 sm:flex-initial min-w-[110px] max-w-full box-border px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-white/20 hover:border-white/40 text-xs font-mono font-semibold transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <CreditCard className="w-3.5 h-3.5 text-zinc-300" />
            <span>Pay Razorpay</span>
          </button>
        </div>
      </div>

      {/* Tipping & Razorpay Checkout Modal (Strictly Monochromatic) */}
      {showModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in text-left box-border"
        >
          <div className="w-full max-w-sm max-w-full rounded-2xl border border-white/10 bg-zinc-950 p-5 space-y-4 shadow-2xl text-white box-border">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Tip {creatorName}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Powered by Razorpay (UPI & Cards)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Method Tabs: Razorpay vs Coins */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-white/[0.06] text-xs font-mono">
              <button
                type="button"
                onClick={() => setTipMethod('razorpay')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all cursor-pointer ${
                  tipMethod === 'razorpay'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Razorpay (UPI / Card)
              </button>
              <button
                type="button"
                onClick={() => setTipMethod('coins')}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all cursor-pointer ${
                  tipMethod === 'coins'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Coins
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/20 text-[11px] text-zinc-300 font-mono">
                {errorMessage}
              </div>
            )}

            {/* Razorpay Amount Selection */}
            {tipMethod === 'razorpay' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1.5">
                    Select Tip Amount (INR)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[20, 50, 100, 200].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedInr(amt);
                          setCustomInr(amt.toString());
                        }}
                        className={`py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                          selectedInr === amt && customInr === amt.toString()
                            ? 'bg-white text-zinc-950 border-white shadow-xs'
                            : 'bg-zinc-900 text-zinc-300 border-white/[0.08] hover:border-white/30'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400 font-bold">₹</span>
                    <input
                      type="number"
                      min={10}
                      max={20000}
                      value={customInr}
                      onChange={(e) => {
                        setCustomInr(e.target.value);
                        setSelectedInr(parseInt(e.target.value) || 0);
                      }}
                      placeholder="Custom amount"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Message for Mangaka (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Leave a note of encouragement..."
                    value={tipMessage}
                    onChange={(e) => setTipMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.04] text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>Secure checkout via Razorpay: UPI, Google Pay, PhonePe, Paytm, Cards.</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingRazorpay || selectedInr <= 0}
                    onClick={() => handlePayViaRazorpay(selectedInr)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold font-mono text-xs flex items-center gap-1.5 hover:ring-2 hover:ring-white/30 transition-all duration-200 active:scale-95 cursor-pointer shadow disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isProcessingRazorpay ? 'Opening Gateway...' : `Pay ₹${selectedInr} via Razorpay`}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Coin Tip Section */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1.5">
                    Select Coins
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 50, 100].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedInr(c)}
                        className={`py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                          selectedInr === c
                            ? 'bg-white text-zinc-950 border-white shadow-xs'
                            : 'bg-zinc-900 text-zinc-300 border-white/[0.08] hover:border-white/30'
                        }`}
                      >
                        🪙 {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Message for Mangaka (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Leave a note of encouragement..."
                    value={tipMessage}
                    onChange={(e) => setTipMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendCoins(selectedInr)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold font-mono text-xs flex items-center gap-1.5 hover:ring-2 hover:ring-white/30 transition-all duration-200 active:scale-95 cursor-pointer shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send {selectedInr} Coins</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
