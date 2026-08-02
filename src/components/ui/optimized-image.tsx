import React, { useState } from "react";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { cn } from "@/lib/utils";

export interface OptimizedImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  src: string | null | undefined;
  alt: string;
  widthParam?: number;
  qualityParam?: number;
  fallbackSrc?: string;
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  widthParam = 800,
  qualityParam = 80,
  fallbackSrc = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
  className,
  containerClassName,
  loading = "lazy",
  decoding = "async",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = hasError
    ? fallbackSrc
    : optimizeImageUrl(src, { width: widthParam, quality: qualityParam });

  return (
    <div className={cn("relative overflow-hidden bg-muted/30", containerClassName)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/40 animate-pulse transition-opacity duration-300" />
      )}
      <img
        src={optimizedSrc || fallbackSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) setHasError(true);
          setIsLoaded(true);
        }}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
        {...props}
      />
    </div>
  );
};
