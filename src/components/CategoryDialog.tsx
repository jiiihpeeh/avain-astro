import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

type Props = {
  category: string;
  images: string[];
  onClose: () => void;
};

const Dialog: React.FC<Props> = ({ category, images, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded shadow-lg max-w-4xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">{category}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${category} ${i + 1}`}
              className="rounded shadow max-h-48 object-cover w-full"
            />
          ))}
        </div>
        <button
          className="mt-4 px-4 py-2 bg-gray-700 text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const CategoryDialog = {
  open: (category: string, images: string[]) => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    const close = () => {
      root.unmount();
      div.remove();
    };

    root.render(<Dialog category={category} images={images} onClose={close} />);
  },
};

export default CategoryDialog;
