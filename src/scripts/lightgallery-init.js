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
    const thumbnailElement = link.querySelector('img');
    if (!thumbnailElement) return;
    const thumbnailBase = thumbnailElement.src.split('.').slice(0, -1).join('.')
    if (!base) return;
    if (avifSupported) {
      link.href = `${base}.avif`;
      thumbnailElement.src = `${thumbnailBase}.avif`
    } else if (webpSupported) {
      link.href = `${base}.webp`;
      thumbnailElement.src = `${thumbnailBase}.webp`
    } else {
      link.href = `${base}.jpg`;
      thumbnailElement.src = `${thumbnailBase}.jpg`
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