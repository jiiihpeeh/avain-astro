import React, { useEffect, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import '@/styles/gallery.css';

export interface ImageData {
  original: string;
  thumbnail: string;
  description: string;
  type?: 'image' | 'video';
}

interface Props {
  data: ImageData[];
}

function loadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src;
  });
}

export async function detectSupportedFormat(): Promise<'avif' | 'webp' | 'jpg'> {
  const avifSrc =
    "data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZgAAAOptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAImlsb2MAAAAAREAAAQABAAAAAAEOAAEAAAAAAAAAIgAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAamlwcnAAAABLaXBjbwAAABNjb2xybmNseAABAA0AAIAAAAAMYXYxQ4EgAgAAAAAUaXNwZQAAAAAAAAAQAAAAEAAAABBwaXhpAAAAAAMICAgAAAAXaXBtYQAAAAAAAAABAAEEgYIDhAAAACptZGF0EgAKCDgM/9lAQ0AIMhQQAAAAFLm4wN/TRReKCcSo648oag==";
  const webpSrc =
    "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoIAAgAAkA4JaQAA3AA/vuUAAA=";

  try {
    await loadImage(avifSrc);
    return "avif";
  } catch {
    try {
      await loadImage(webpSrc);
      return "webp";
    } catch {
      return "jpg";
    }
  }
}

export default function Gallery({ data }: Props) {
  const [extension, setExtension] = useState<'avif' | 'webp' | 'jpg'>('jpg');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    detectSupportedFormat().then(setExtension);
  }, []);

  // Manage class on body for fullscreen styling
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('gallery-fullscreen');
    } else {
      document.body.classList.remove('gallery-fullscreen');
    }
  }, [isFullscreen]);

  const galleryItems = data.map((item) => {
    if (item.type === 'video') {
      return {
        original: `${item.original}.webm`,
        thumbnail: `${item.thumbnail}.webp`,
        description: item.description,
        renderItem: () => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <video
              controls
              preload="metadata"
              style={{
                height: isFullscreen ? 'auto' : '480px',
                maxHeight: isFullscreen ? '100vh' : '640px',
                objectFit: 'contain',
              }}
              poster={`${item.thumbnail}.webp`}
              src={`${item.original}.webm`}
            />
          </div>
        ),
      };
    } else {
      return {
        original: `${item.original}.${extension}`,
        thumbnail: `${item.thumbnail}.${extension}`,
        description: item.description,
      };
    }
  });

  return (
    <div className="w-full flex justify-center mt-8 px-4">
      <div className="max-w-2xl w-full max-h-[800px] overflow-auto">
        <ImageGallery
          items={galleryItems}
          showPlayButton={false}
          showFullscreenButton={true}
          onScreenChange={setIsFullscreen}
        />
        <style>{`
          /* Default slide image style */
          .image-gallery-slide img {
            height: 640px;
            object-fit: contain;
          }

          /* Fullscreen override applied via body class */
          body.gallery-fullscreen .image-gallery-slide img {
            height: auto !important;
            max-height: 100vh !important;
            object-fit: contain !important;
          }

          /* Video override for fullscreen */
          body.gallery-fullscreen .image-gallery-slide video {
            height: auto !important;
            max-height: 100vh !important;
            object-fit: contain !important;
          }

          /* Thumbnail styling */
          .image-gallery-thumbnail img {
            height: 80px;
            width: auto;
            object-fit: contain;
          }
        `}</style>
      </div>
    </div>
  );
}
