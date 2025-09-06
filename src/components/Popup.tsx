import { useState, useEffect, useRef } from "react";

interface Content {
  title: string;
  description: string;
}

export default function Popup({ title, description }: Content) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAbove, setShowAbove] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setShowAbove(spaceBelow < 230); // Show above if less than 150px space below
    }
  }, [isOpen]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        ref={buttonRef} 
        className="bg-teal-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-600 transition"
      >
        {title}
      </button>
  
      {isOpen && (
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg border border-gray-300 text-sm text-gray-700 min-w-[260px] max-w-[400px] transition-opacity duration-300 opacity-100 z-50
            ${showAbove ? "bottom-full mb-3" : "top-full mt-3"}
          `}
          style={{ whiteSpace: 'normal' }}  // allow text to wrap nicely
        >
          {description}
        </div>
      )}
    </div>
  );
}