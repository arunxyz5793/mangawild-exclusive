import React from 'react';
import { Clock, ExternalLink, Newspaper } from 'lucide-react';
import { WORLDWIDE_MANGA_NEWS } from '../services/storage';

export const NewsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-fade-in">
      <div className="border-b border-white/10 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded font-mono">
          MANGAWILD STUDIO CHRONICLES
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-sans mt-2 tracking-tight">
          MangaWild Studio News & Releases
        </h1>
        <p className="text-xs text-stone-400 mt-1">
          Official serialization announcements, new chapter drops, and studio milestones from MangaWild creators
        </p>
      </div>

      <div className="space-y-4">
        {WORLDWIDE_MANGA_NEWS.map(news => (
          <div
            key={news.id}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 transition-all duration-200 hover:-translate-y-0.5 space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-200 bg-white/10 px-2.5 py-0.5 rounded border border-white/15">
                {news.category}
              </span>
              <span className="flex items-center gap-1.5 text-stone-400">
                <Clock className="w-3.5 h-3.5" /> {news.timeAgo} · {news.source}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white hover:text-stone-300 transition-colors cursor-pointer active:scale-99">
              {news.title}
            </h2>

            <p className="text-sm text-stone-300 leading-relaxed">
              {news.summary}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs text-stone-400 border-t border-white/5">
              <span>Official MangaWild Publishing Desk</span>
              <span className="text-white hover:underline font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform">
                <span>View Release Notes</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
