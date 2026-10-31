import React, { useState, useRef } from 'react';
import {
  Star,
  X,
  ChevronDown,
  Check,
  ImagePlus,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';

interface BetaCategoryOption {
  id: string;
  label: string;
  sublabel: string;
  needsScreenshotOption: boolean;
}

const BETA_CATEGORIES: BetaCategoryOption[] = [
  {
    id: 'general_beta_review',
    label: 'Overall Beta Review & Experience',
    sublabel: 'Share your overall thoughts and review on MANGAWILD',
    needsScreenshotOption: false,
  },
  {
    id: 'website_bug',
    label: 'Report a Website Bug or Technical Glitch',
    sublabel: 'Report a broken button, error, or unexpected issue',
    needsScreenshotOption: true,
  },
  {
    id: 'weird_or_problematic',
    label: 'Something Feels Weird or Design Problem',
    sublabel: 'Point out any layout problem, design issue, or awkward UI detail',
    needsScreenshotOption: true,
  },
  {
    id: 'manga_reader_issue',
    label: 'Manga Reader, Page Flip or Zoom Problem',
    sublabel: 'Report an issue with reading panels, page transitions, or zoom',
    needsScreenshotOption: true,
  },
  {
    id: 'creator_studio_upload',
    label: 'Creator Studio & Manga Publishing Issue',
    sublabel: 'Problem with uploading chapters, creator profile, or studio tools',
    needsScreenshotOption: true,
  },
  {
    id: 'account_profile_menu',
    label: 'Account, Sign-In or Profile Menu Problem',
    sublabel: 'Issue with login, account settings, library, or bottom menu',
    needsScreenshotOption: true,
  },
  {
    id: 'exclusive_payment',
    label: 'Exclusive Pass & Payment / Checkout Issue',
    sublabel: 'Problem with subscription plans or Razorpay payment popup',
    needsScreenshotOption: true,
  },
  {
    id: 'speed_and_smoothness',
    label: 'Website Speed, Smoothness & Performance',
    sublabel: 'Feedback on page loading speed, scrolling smoothness, or mobile feel',
    needsScreenshotOption: false,
  },
  {
    id: 'feature_suggestion',
    label: 'Feature Suggestion or Improvement',
    sublabel: 'Suggest a new feature or idea for the platform',
    needsScreenshotOption: false,
  },
];

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.76));
      };
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const BetaReviewWidget: React.FC = () => {
  const { user, isAuthenticated, isVIP } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<BetaCategoryOption>(BETA_CATEGORIES[0]);
  const [isListOpen, setIsListOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [screenshots, setScreenshots] = useState<(string | null)[]>([null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenSlotPicker = (slotIdx: number) => {
    setActiveSlotIndex(slotIdx);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const compressedList = await Promise.all(files.slice(0, 3).map(f => compressImageToDataUrl(f)));
      setScreenshots(prev => {
        const next = [...prev];
        if (compressedList.length === 1 && activeSlotIndex !== null) {
          next[activeSlotIndex] = compressedList[0];
        } else {
          let insertCursor = activeSlotIndex !== null ? activeSlotIndex : 0;
          for (const dataUrl of compressedList) {
            const emptyIdx = next.findIndex(item => item === null);
            if (emptyIdx !== -1) {
              next[emptyIdx] = dataUrl;
            } else if (insertCursor < 3) {
              next[insertCursor] = dataUrl;
              insertCursor = (insertCursor + 1) % 3;
            }
          }
        }
        return next;
      });
    } catch {
      setErrorMsg('Could not process selected image. Please try another screenshot.');
    }
  };

  const handleRemoveScreenshot = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setScreenshots(prev => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg('Please describe your review, bug report, or feedback before submitting.');
      return;
    }

    const validScreenshots = selectedCategory.needsScreenshotOption
      ? screenshots.filter((s): s is string => Boolean(s))
      : [];

    const reviewerName = isAuthenticated
      ? user.name
      : guestName.trim() || 'Beta Tester';

    StorageService.addBetaExclusiveReview({
      userId: isAuthenticated ? user.id : `beta_guest_${Date.now()}`,
      userName: reviewerName,
      userEmail: isAuthenticated ? user.email : 'Beta Tester Account',
      userAvatar: isAuthenticated ? user.avatarUrl : '/avatars/avatar-1.svg',
      userRole: isAuthenticated ? user.role : 'beta_tester',
      isVIP: Boolean(isVIP || user.isVIP),
      rating,
      category: selectedCategory.id,
      categoryLabel: selectedCategory.label,
      description: description.trim(),
      screenshots: validScreenshots,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsOpen(false);
      setDescription('');
      setScreenshots([null, null, null]);
      setRating(5);
      setSelectedCategory(BETA_CATEGORIES[0]);
      setIsListOpen(false);
    }, 1500);
  };

  const activeStarCount = hoverRating || rating;

  return (
    <>
      {/* Always-Visible Floating Circular "Review" Button — Inset from Frame & Elevated Above Bottom Profile Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open MANGAWILD BETA EXCLUSIVE Review"
        title="MANGAWILD BETA EXCLUSIVE — Leave a Review or Report an Issue"
        className={`fixed bottom-[76px] sm:bottom-[88px] right-4 sm:right-6 md:right-8 z-[45] w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 select-none cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 ${
          isLight
            ? 'bg-white text-black border-black shadow-[0_8px_28px_rgba(0,0,0,0.2)] hover:bg-black hover:text-white'
            : 'bg-black text-white border-white shadow-[0_8px_30px_rgba(0,0,0,0.88)] hover:bg-white hover:text-black'
        }`}
      >
        <Star className="w-4 h-4 fill-current stroke-[2px]" />
        <span className="text-[10px] sm:text-[11px] font-black tracking-tight leading-none">
          Review
        </span>
      </button>

      {/* MANGAWILD BETA EXCLUSIVE Review & Feedback Popup Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 modal-backdrop-overlay bg-black/75 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-2 p-5 sm:p-6 shadow-2xl transition-colors select-none ${
              isLight
                ? 'bg-white text-black border-black'
                : 'bg-[#09090b] text-white border-white/25'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-start justify-between gap-3 pb-4 border-b ${
                isLight ? 'border-black' : 'border-white/15'
              }`}
            >
              <div className="space-y-1">
                <span
                  className={`font-rockidz-3d block text-sm sm:text-base tracking-wider leading-none ${
                    isLight ? 'text-black' : 'text-white'
                  }`}
                  style={{
                    fontFamily: "'Rockidz 3D', 'Rockidz', cursive, system-ui, sans-serif",
                    letterSpacing: '0.04em',
                    color: isLight ? '#000000' : '#ffffff',
                    WebkitTextFillColor: isLight ? '#000000' : '#ffffff',
                  }}
                >
                  MANGAWILD BETA EXCLUSIVE
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Beta Review &amp; Feedback
                </h2>
                <p className="text-xs opacity-75">
                  Share your review, report any bug, or highlight anything that feels off.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                    : 'bg-zinc-900 text-white border-white/20 hover:bg-white hover:text-black'
                }`}
                aria-label="Close Review Popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-12 text-center space-y-3">
                <div
                  className={`w-14 h-14 mx-auto rounded-full border-2 flex items-center justify-center ${
                    isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
                  }`}
                >
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black">Review Submitted!</h3>
                <p className="text-xs opacity-80 max-w-xs mx-auto">
                  Thank you for helping us test and refine <strong>MANGAWILD BETA EXCLUSIVE</strong>. Your review is now visible in the Admin Panel.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {/* Account Badge or Optional Name if Guest */}
                <div
                  className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isLight ? 'bg-white border-black text-black' : 'bg-zinc-900/70 border-white/15 text-white'
                  }`}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="truncate">
                        <span className="font-bold">{user.name}</span>
                        <span className="opacity-70 ml-1.5 font-mono text-[11px]">({user.email})</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border shrink-0">
                        Account
                      </span>
                    </>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <span className="text-[11px] font-bold shrink-0">Your Name:</span>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Enter your name or handle (optional)"
                        className="w-full bg-transparent text-xs font-medium focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 1. 5-Star Rating Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider font-mono">
                      Rate Your Experience (Out of 5 Stars)
                    </label>
                    <span className="text-xs font-mono font-black">
                      {activeStarCount} / 5 Stars
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                      isLight ? 'bg-white border-black' : 'bg-zinc-900/60 border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFilled = starValue <= activeStarCount;
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-115 active:scale-95 cursor-pointer"
                            aria-label={`Rate ${starValue} out of 5 stars`}
                          >
                            <Star
                              className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${
                                isFilled ? 'fill-current stroke-[2px]' : 'opacity-30 stroke-[1.75px]'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-bold">
                      {activeStarCount === 5
                        ? 'Excellent'
                        : activeStarCount === 4
                        ? 'Very Good'
                        : activeStarCount === 3
                        ? 'Good'
                        : activeStarCount === 2
                        ? 'Needs Work'
                        : 'Critical Issue'}
                    </span>
                  </div>
                </div>

                {/* 2. Clickable Category / Topic List Section */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold uppercase tracking-wider font-mono block">
                    Select What You Want to Review or Report
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsListOpen((prev) => !prev)}
                    className={`w-full px-3.5 py-3 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isLight
                        ? 'bg-white text-black border-black'
                        : 'bg-zinc-900/80 text-white border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black truncate">
                        {selectedCategory.label}
                      </p>
                      <p className="text-[11px] opacity-70 truncate">
                        {selectedCategory.sublabel}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isListOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isListOpen && (
                    <div
                      className={`mt-1.5 rounded-xl border-2 max-h-56 overflow-y-auto divide-y shadow-xl ${
                        isLight
                          ? 'bg-white text-black border-black divide-black/15'
                          : 'bg-[#0c0c0f] text-white border-white/25 divide-white/10'
                      }`}
                    >
                      {BETA_CATEGORIES.map((cat) => {
                        const isSelected = cat.id === selectedCategory.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsListOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? isLight
                                  ? 'bg-black text-white'
                                  : 'bg-white text-black'
                                : isLight
                                ? 'hover:bg-black/5'
                                : 'hover:bg-white/10'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{cat.label}</p>
                              <p className="text-[10px] opacity-75 truncate">{cat.sublabel}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Description Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider font-mono block">
                    Describe in Detail
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write your review, describe the bug, or tell us about even the smallest detail that felt weird or problematic..."
                    className={`w-full rounded-xl border p-3 text-xs sm:text-sm leading-relaxed focus:outline-none resize-none ${
                      isLight
                        ? 'bg-white text-black border-black placeholder-black/50'
                        : 'bg-zinc-900/70 text-white border-white/20 placeholder-white/40 focus:border-white'
                    }`}
                  />
                </div>

                {/* 4. Optional Screenshots — ONLY shown when reporting a bug, design issue, or problem */}
                {selectedCategory.needsScreenshotOption && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider font-mono block">
                        Screenshots (Optional)
                      </label>
                      <span className="text-[10px] font-mono opacity-75">
                        Optional — only if you want to point out something
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFilesSelected}
                      className="hidden"
                    />

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {[0, 1, 2].map((slotIdx) => {
                        const imgData = screenshots[slotIdx];
                        return (
                          <div
                            key={slotIdx}
                            onClick={() => handleOpenSlotPicker(slotIdx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenSlotPicker(slotIdx);
                              }
                            }}
                            className={`relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all ${
                              isLight
                                ? 'bg-white border-black hover:bg-black/5'
                                : 'bg-zinc-900/60 border-white/25 hover:border-white'
                            }`}
                          >
                            {imgData ? (
                              <>
                                <img
                                  src={imgData}
                                  alt={`Screenshot ${slotIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveScreenshot(slotIdx, e)}
                                  className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full border flex items-center justify-center shadow-md cursor-pointer ${
                                    isLight
                                      ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                                      : 'bg-black/90 text-white border-white/30 hover:bg-white hover:text-black'
                                  }`}
                                  title="Remove Screenshot"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
                                <ImagePlus className="w-5 h-5 opacity-75" />
                                <span className="text-[10px] font-bold">
                                  Add Image
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      isLight ? 'bg-white text-black border-black' : 'bg-zinc-900 text-white border-white/30'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 5. Submit & Cancel Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                        : 'bg-zinc-900 text-white border-white/20 hover:bg-white hover:text-black'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                      isLight
                        ? 'bg-black text-white border-black hover:opacity-90'
                        : 'bg-white text-black border-white hover:bg-zinc-200'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
