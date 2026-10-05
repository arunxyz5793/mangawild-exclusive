import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, RefreshCw } from 'lucide-react';

interface BlurUpMangaImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  panelNumber?: number;
  onLoad?: () => void;
  aspectRatio?: number; // e.g. 0.7 for standard manga ratio (width / height)
}

export const BlurUpMangaImage: React.FC<BlurUpMangaImageProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  style,
  imgStyle,
  loading = 'lazy',
  panelNumber,
  onLoad,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached in browser on mount or src change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [src, retryKey]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoaded(false);
    setRetryKey(prev => prev + 1);
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none bg-[#090b10] ${className}`}
      style={style}
    >
      {/* 1. Blur-up Background Skeleton & Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0e111a] via-[#090b10] to-[#0e111a] animate-pulse">
          {/* Subtle Ambient Manga Grid Placeholder */}
          <div className="flex flex-col items-center gap-2 opacity-50">
            <ImageIcon className="w-8 h-8 text-zinc-600 animate-pulse" />
            {panelNumber !== undefined && (
              <span className="text-[11px] font-mono text-zinc-500 font-semibold tracking-wider uppercase">
                Loading Page {panelNumber}...
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Error Fallback State */}
      {hasError ? (
        <div className="w-full min-h-[350px] flex flex-col items-center justify-center p-6 text-center bg-[#0d0f17] border border-red-900/30 rounded-xl space-y-3 z-10">
          <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-800 text-red-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {panelNumber ? `Page ${panelNumber} failed to load` : 'Failed to load panel'}
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Check your connection or tap below to reload the image scan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Page</span>
          </button>
        </div>
      ) : (
        /* 3. Actual Image with Blur-Up Transition Filter */
        <img
          key={`${src}_${retryKey}`}
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          draggable={false}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          data-protected-img="true"
          style={{
            ...imgStyle,
            transition: 'filter 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
          }}
          className={`block w-full h-auto select-none pointer-events-none transition-all duration-500 ${
            isLoaded
              ? 'blur-0 scale-100 opacity-100'
              : 'blur-xl scale-105 opacity-40'
          } ${imgClassName}`}
        />
      )}

      {/* 4. Anti-Download Security Shield */}
      <div
        className="absolute inset-0 z-10 bg-transparent select-none pointer-events-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        aria-hidden="true"
      />
    </div>
  );
};
