import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

/** A dump photo that shows a neat placeholder, not squashed alt text, if the image fails to load. */
export function DumpPhoto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    return (
      <div role="img" aria-label={`${alt} (photo unavailable)`} className={`${className ?? ''} flex items-center justify-center bg-slate-100 text-slate-400`}>
        <ImageOff className="w-1/3 h-1/3 max-w-8 max-h-8" aria-hidden />
      </div>
    );
  }
  return <img src={src} alt={alt} referrerPolicy="no-referrer" className={className} onError={() => setFailed(true)} />;
}
