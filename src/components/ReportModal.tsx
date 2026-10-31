import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  CheckCircle,
  FileQuestion,
  Sparkles,
  Instagram,
  Mail,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { UserReport } from '../types/manga';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSeriesId?: string;
  defaultSeriesTitle?: string;
  defaultChapterNumber?: number;
}

const REPORT_CATEGORIES = [
  { id: 'panel_issue', label: 'Manga Panel / Image Loading Issue', desc: 'Panel is blurry, missing, or failed to render' },
  { id: 'broken_page', label: 'Broken Page or Missing Text', desc: 'Page order incorrect or speech bubbles cut off' },
  { id: 'website_bug', label: 'Website Bug or Mobile Layout Issue', desc: 'Buttons not working, swipe issue, or display glitch' },
  { id: 'subscription_payment', label: 'Subscription / Payment Issue', desc: 'Problem activating Exclusive pass or billing' },
  { id: 'copyright_concern', label: 'Copyright or Content Concern', desc: 'Intellectual property or content violation notice' },
  { id: 'other', label: 'Other Feedback or Suggestions', desc: 'General feedback, feature request, or suggestion' },
] as const;

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  defaultSeriesId,
  defaultSeriesTitle,
  defaultChapterNumber,
}) => {
  const { user } = useAuth();

  const [category, setCategory] = useState<UserReport['category']>('panel_issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [contactEmail, setContactEmail] = useState(user.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const categoryObj = REPORT_CATEGORIES.find(c => c.id === category);

    StorageService.addReport({
      category,
      categoryLabel: categoryObj?.label || 'General Issue',
      subject: subject.trim() || `${categoryObj?.label || 'Issue'} Report`,
      description: description.trim(),
      instagramHandle: instagramHandle.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      seriesId: defaultSeriesId,
      seriesTitle: defaultSeriesTitle,
      chapterNumber: defaultChapterNumber,
      userId: user.id !== 'guest_reader' ? user.id : undefined,
      userName: user.name || user.username || 'Reader',
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubject('');
    setDescription('');
    setInstagramHandle('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-black border border-white/25 rounded-3xl shadow-2xl p-6 sm:p-8 text-white select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">Report Submitted!</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Thank you for notifying us. Our MangaWild moderation and technical team will investigate this issue immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md mt-4 active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Issue & Feedback Report</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Report a Problem</h2>
              <p className="text-xs text-zinc-400">
                Help us improve MangaWild. Describe the issue you faced below.
              </p>
            </div>

            {/* Context Badge if from specific manga */}
            {defaultSeriesTitle && (
              <div className="flex items-center gap-2 p-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="font-semibold text-white truncate">{defaultSeriesTitle}</span>
                {defaultChapterNumber !== undefined && (
                  <span className="text-zinc-500 font-mono text-[11px]">
                    · Ch. {defaultChapterNumber}
                  </span>
                )}
              </div>
            )}

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 block font-semibold">
                What kind of issue are you reporting? *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as UserReport['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-medium focus:outline-none focus:border-white transition-colors cursor-pointer"
              >
                {REPORT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-zinc-900 text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 block font-semibold">
                Brief Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Page 4 not displaying properly"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 block font-semibold">
                Description & Details *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what happened, error message, or steps to reproduce..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-white transition-colors resize-none"
              />
            </div>

            {/* Instagram / Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>Instagram Handle (Optional)</span>
                </label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={e => setInstagramHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email (Optional for updates)</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
