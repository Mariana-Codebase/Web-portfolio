import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onComplete: () => void;
  isDarkMode: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isDarkMode }) => {
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowName(true), 300);
    setTimeout(() => onComplete(), 3000);
    return () => {};
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-1000 ${
      isDarkMode ? 'bg-[#050505]' : 'bg-[#a8a29e]'
    }`}>
      <div className={`mb-16 transition-all duration-1000 ${showName ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex justify-center items-center">
          <Logo size={200} isDarkMode={isDarkMode} />
        </div>
      </div>

      <div className="loader"></div>

      <style>{`
        .loader {
          display: inline-flex;
          gap: 12px;
        }
        .loader:before,
        .loader:after {
          content: "";
          height: 28px;
          aspect-ratio: 1;
          border-radius: 50%;
          background:
            radial-gradient(farthest-side, #000000 95%, transparent) 35% 35%/8px 8px no-repeat
            #ffffff;
          transform: scaleX(var(--s,1)) rotate(0deg);
          animation: l6 1s infinite linear;
        }
        .loader:after {
          --s: -1;
          animation-delay: -0.1s;
        }
        @keyframes l6 {
          100% {transform: scaleX(var(--s,1)) rotate(360deg);}
        }
      `}</style>
    </div>
  );
};
