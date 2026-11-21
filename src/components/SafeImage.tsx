import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle = 'Green Acrres · Pali Hill',
  loading = 'eager',
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#132b30] via-[#1f2a31] to-[#0e2226] p-6 text-center ${className}`}
      >
        <Building2 className="mb-3 h-7 w-7 text-[#cbb389]/70" strokeWidth={1.25} />
        <span className="font-serif text-lg tracking-wide text-[#f4efe6]">{fallbackTitle}</span>
        <span className="mt-1 text-xs tracking-widest uppercase text-[#93a1aa]">
          Architectural Plate
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
