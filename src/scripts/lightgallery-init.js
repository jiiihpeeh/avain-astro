// src/scripts/lightgallery-init.js
import lightGallery from 'lightgallery';
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

function testImageFormat(dataUri) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = dataUri;
  });
}

async function supportsAvif() {
  const avifDataUri = "data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZgAAAOptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAImlsb2MAAAAAREAAAQABAAAAAAEOAAEAAAAAAAAAIgAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAamlwcnAAAABLaXBjbwAAABNjb2xybmNseAABAA0AAIAAAAAMYXYxQ4EgAgAAAAAUaXNwZQAAAAAAAAAQAAAAEAAAABBwaXhpAAAAAAMICAgAAAAXaXBtYQAAAAAAAAABAAEEgYIDhAAAACptZGF0EgAKCDgM/9lAQ0AIMhQQAAAAFLm4wN/TRReKCcSo648oag==";
  return testImageFormat(avifDataUri);
}

async function supportsWebp() {
  const webpDataUri = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoIAAgAAkA4JaQAA3AA/vuUAAA="
  return testImageFormat(webpDataUri);
}

export async function initLightGallery() {
  const avifSupported = await supportsAvif();
  const webpSupported = !avifSupported && await supportsWebp();

  document.querySelectorAll('a[data-base]').forEach((link) => {
    const base = link.dataset.base;
    if (!base) return;
    if (avifSupported) {
      link.href = `${base}.avif`;
    } else if (webpSupported) {
      link.href = `${base}.webp`;
    } else {
      link.href = `${base}.jpg`;
    }
  });

  const galleries = document.querySelectorAll('[id^="lightgallery_"]');
  galleries.forEach(galleryEl => {
    lightGallery(galleryEl, {
      plugins: [lgZoom, lgThumbnail],
      speed: 500,
    });
  });
}

initLightGallery()