import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Trash2,
  Send,
  User as UserIcon,
  Sparkles,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { Comment } from '../types/manga';
import { useTheme } from '../context/ThemeContext';
import { getAvatarUrl } from '../utils/avatar';

interface MangaCommentsSectionProps {
  seriesId: string;
  chapterId?: string;
  chapterTitle?: string;
  onOpenAuthModal?: () => void;
}

export const MangaCommentsSection: React.FC<MangaCommentsSectionProps> = ({
  seriesId,
  chapterId,
  chapterTitle,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, hasPerm } = useAuth();
  const { theme } = useTheme();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'top'>('latest');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = hasPerm('APPROVE_CONTENT') || user.role === 'admin';

  // Load comments
  const loadComments = () => {
    let list: Comment[] = [];
    if (chapterId) {
      list = StorageService.getComments(chapterId);
      // If none for this specific chapter, also pull series comments
      if (list.length === 0) {
        list = StorageService.getCommentsBySeries(seriesId);
      }
    } else {
      list = StorageService.getCommentsBySeries(seriesId);
    }
    setComments(list);
  };

  useEffect(() => {
    loadComments();
  }, [seriesId, chapterId]);

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const newComment = StorageService.addComment({
        seriesId,
        chapterId,
        userId: user.id,
        userName: user.name,
        userAvatar: getAvatarUrl(user.avatarUrl),
        userRole: user.role,
        content: trimmed,
      });

      // Track locally so user can always delete their own comment in this session/browser
      try {
        const stored = localStorage.getItem('mangawild_my_comments');
        const list = stored ? JSON.parse(stored) : [];
        list.push(newComment.id);
        localStorage.setItem('mangawild_my_comments', JSON.stringify(list));
      } catch (e) {
        console.warn('Could not save comment to local list', e);
      }

      setNewCommentText('');
      loadComments();
      setSuccessToast('Comment posted successfully!');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = (commentId: string) => {
    if (!isAuthenticated) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    StorageService.toggleLikeComment(commentId, user.id);
    loadComments();
  };

  const handleDeleteComment = (commentId: string) => {
    StorageService.deleteComment(commentId, user.id, isAdmin);
    try {
      const stored = localStorage.getItem('mangawild_my_comments');
      if (stored) {
        const list: string[] = JSON.parse(stored);
        const filtered = list.filter(id => id !== commentId);
        localStorage.setItem('mangawild_my_comments', JSON.stringify(filtered));
      }
    } catch {}
    setConfirmDeleteId(null);
    setComments(prev => prev.filter(c => c.id !== commentId));
    setSuccessToast('Comment deleted successfully!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSecs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  // Helper to render user role cleanly in strict monochrome
  const renderRoleBadge = (role?: string) => {
    if (role === 'creator') {
      return (
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-bold uppercase tracking-wider">
          Creator
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-bold uppercase tracking-wider">
          Admin
        </span>
      );
    }
    if (role === 'subscriber') {
      return (
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-bold uppercase tracking-wider">
          Exclusive
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/15 dark:border-white/20 font-medium">
        Reader
      </span>
    );
  };

  return (
    <section className="space-y-6">
      {/* Header with count and sort toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white fill-zinc-900 dark:fill-white" />
            <h3 className="text-lg font-bold font-serif">
              Comments & Discussion ({comments.length})
            </h3>
          </div>
          {chapterTitle && (
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Discussing: {chapterTitle}
            </p>
          )}
        </div>

        {comments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">Sort:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  sortBy === 'latest'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  sortBy === 'top'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Top Liked
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-black text-white dark:bg-white dark:text-black border border-black/20 dark:border-white/20 text-xs rounded-xl flex items-center gap-2 font-mono">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* New Comment Box */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src={getAvatarUrl(user.avatarUrl)}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{user.name}</span>
              {renderRoleBadge(user.role)}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              placeholder="Leave a comment, feedback or review for the author..."
              rows={3}
              maxLength={500}
              className={`w-full p-3.5 rounded-xl text-xs resize-none transition-colors border focus:outline-none ${
                theme === 'dark'
                  ? 'bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600'
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
              }`}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-zinc-500 font-mono">
                {newCommentText.length} / 500
              </span>
              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmitting}
                className="px-5 py-2 rounded-xl bg-white text-zinc-950 dark:bg-white dark:text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div
          className={`p-6 rounded-2xl border text-center space-y-3 ${
            theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Join the Discussion</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Log in with your account to post comments, discuss plot twists, and support manga creators.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Log In / Sign Up to Comment</span>
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {sortedComments.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 font-mono">
            No comments yet. Be the first reader to start the conversation!
          </div>
        ) : (
          sortedComments.map(comment => {
            let myLocalComments: string[] = [];
            try {
              const stored = localStorage.getItem('mangawild_my_comments');
              if (stored) myLocalComments = JSON.parse(stored);
            } catch {
              myLocalComments = [];
            }
            const isAuthor =
              (user.id && user.id === comment.userId) ||
              myLocalComments.includes(comment.id) ||
              (user.name && user.name === comment.userName);
            const isLiked = (comment.likedByUsers || []).includes(user.id);

            return (
              <div
                key={comment.id}
                className={`p-4 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getAvatarUrl(comment.userAvatar)}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold">{comment.userName}</span>
                        {renderRoleBadge(comment.userRole)}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete option for comment author or admin */}
                  {(isAuthor || isAdmin) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {confirmDeleteId === comment.id ? (
                        <div className="flex items-center gap-1 bg-red-950/80 border border-red-800 rounded-lg p-1 text-[11px] animate-fade-in">
                          <span className="text-red-300 font-bold px-1 font-mono text-[10px]">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(comment.id)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                <p className="mt-2.5 text-xs text-zinc-200 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap pl-10.5">
                  {comment.content}
                </p>

                {/* Action Bar (Like/Upvote) */}
                <div className="mt-3 pl-10.5 flex items-center gap-4 text-xs text-zinc-400 font-mono">
                  <button
                    onClick={() => handleToggleLike(comment.id)}
                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                      isLiked
                        ? 'bg-white text-zinc-950 font-bold border-white'
                        : 'border-zinc-800 bg-zinc-900/60 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likes || 0}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
