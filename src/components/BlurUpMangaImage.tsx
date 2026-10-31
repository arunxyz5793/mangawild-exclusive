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

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    let timerId: number | undefined;
    const rafId = requestAnimationFrame(() => {
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        timerId = window.setTimeout(() => {
          setIsLoaded(true);
          onLoad?.();
        }, 45);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [src, retryKey]);

  const handleImageLoad = () => {
    setHasError(false);
    window.setTimeout(() => {
      setIsLoaded(true);
      onLoad?.();
    }, 45);
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
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={style}
    >
      {/* Error Fallback State */}
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
        /* Actual Image with Guaranteed Blur-to-Sharp Transition (No Loading Page Overlay) */
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
            filter: isLoaded ? 'blur(0px)' : 'blur(18px)',
            transform: isLoaded ? 'scale(1)' : 'scale(1.02)',
            transition: isLoaded
              ? 'filter 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
          }}
          className={`block w-full h-auto select-none pointer-events-none ${imgClassName}`}
        />
      )}

      {/* Anti-Download Security Shield */}
      <div
        className="absolute inset-0 z-10 bg-transparent select-none pointer-events-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        aria-hidden="true"
      />
    </div>
  );
};
