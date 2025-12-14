import React from 'react';

interface ClipboardLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export const ClipboardLogo: React.FC<ClipboardLogoProps> = ({ 
  size = 567, 
  className = '',
  animated = true 
}) => {
  return (
    <div className={`${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 567 567"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animated ? 'animate-pulse-slow' : ''}
      >
        {/* Clipboard body */}
        <rect 
          x="133.5" 
          y="84.75" 
          width="300" 
          height="378" 
          rx="24" 
          fill="#ffffff" 
          stroke="#3b82f6" 
          strokeWidth="8"
          className="drop-shadow-lg"
        />
        
        {/* Clipboard clip */}
        <rect 
          x="233.5" 
          y="50.75" 
          width="100" 
          height="60" 
          rx="12" 
          fill="#3b82f6" 
          stroke="#1e40af" 
          strokeWidth="4"
        />
        
        {/* Clip hole */}
        <circle 
          cx="283.5" 
          cy="80.75" 
          r="8" 
          fill="#1e40af"
        />

        {/* Cute Eyes */}
        <g className={animated ? 'animate-blink' : ''}>
          <circle 
            cx="233.5" 
            cy="170" 
            r="16" 
            fill="white" 
            stroke="#1e40af" 
            strokeWidth="2"
          />
          <circle 
            cx="233.5" 
            cy="170" 
            r="8" 
            fill="#1e40af"
          />
          <circle 
            cx="230" 
            cy="167" 
            r="3" 
            fill="white"
            className={animated ? 'animate-sparkle' : ''}
          />
          
          <circle 
            cx="333.5" 
            cy="170" 
            r="16" 
            fill="white" 
            stroke="#1e40af" 
            strokeWidth="2"
          />
          <circle 
            cx="333.5" 
            cy="170" 
            r="8" 
            fill="#1e40af"
          />
          <circle 
            cx="330" 
            cy="167" 
            r="3" 
            fill="white"
            className={animated ? 'animate-sparkle' : ''}
          />
        </g>

        {/* Subtle Smile */}
        <path 
          d="M250 195 Q283.5 215 317 195" 
          stroke="#1e40af" 
          strokeWidth="4" 
          strokeLinecap="round" 
          fill="none"
          className={animated ? 'animate-float' : ''}
        />

        {/* Check marks and lines */}
        {/* First check mark (Yellow) */}
        <g>
          <line 
            x1="200" 
            y1="240" 
            x2="300" 
            y2="240" 
            stroke="#64748b" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <line 
            x1="200" 
            y1="280" 
            x2="320" 
            y2="280" 
            stroke="#64748b" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <circle 
            cx="180" 
            cy="240" 
            r="12" 
            fill="#10b981"
            className={animated ? 'animate-bounce-subtle' : ''}
          />
          <path 
            d="M174 240 L178 244 L186 236" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
        </g>

        {/* Second check mark (Red) */}
        <g>
          <line 
            x1="200" 
            y1="320" 
            x2="280" 
            y2="320" 
            stroke="#64748b" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <line 
            x1="200" 
            y1="360" 
            x2="340" 
            y2="360" 
            stroke="#64748b" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <circle 
            cx="180" 
            cy="320" 
            r="12" 
            fill="#f59e0b"
            className={animated ? 'animate-bounce-subtle' : ''}
            style={{ animationDelay: '0.5s' }}
          />
          <path 
            d="M174 320 L178 324 L186 316" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
        </g>

        {/* Third check mark (Blue) */}
        <g>
          <line 
            x1="200" 
            y1="400" 
            x2="260" 
            y2="400" 
            stroke="#64748b" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <line 
            x1="200" 
            y1="440" 
            x2="320" 
            y2="440" 
            stroke="#64748b" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <circle 
            cx="180" 
            cy="400" 
            r="12" 
            fill="#3b82f6"
            className={animated ? 'animate-bounce-subtle' : ''}
            style={{ animationDelay: '1s' }}
          />
          <path 
            d="M174 400 L178 404 L186 396" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
        </g>

        {/* Underlines */}
        <line 
          x1="350" 
          y1="240" 
          x2="400" 
          y2="240" 
          stroke="#000000" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <line 
          x1="350" 
          y1="280" 
          x2="380" 
          y2="280" 
          stroke="#000000" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <line 
          x1="350" 
          y1="320" 
          x2="390" 
          y2="320" 
          stroke="#000000" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <line 
          x1="350" 
          y1="360" 
          x2="375" 
          y2="360" 
          stroke="#000000" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <line 
          x1="350" 
          y1="400" 
          x2="385" 
          y2="400" 
          stroke="#000000" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <line 
          x1="350" 
          y1="440" 
          x2="395" 
          y2="440" 
          stroke="#000000" 
          strokeWidth="3" 
          strokeLinecap="round"
        />

        {/* High-five hand */}
        <g className={animated ? 'animate-wave' : ''}>
          <circle 
            cx="450" 
            cy="200" 
            r="20" 
            fill="#fed7aa" 
            stroke="#f97316" 
            strokeWidth="2"
          />
          <rect 
            x="430" 
            y="190" 
            width="15" 
            height="40" 
            rx="7" 
            fill="#fed7aa" 
            stroke="#f97316" 
            strokeWidth="2"
          />
          <line 
            x1="435" 
            y1="185" 
            x2="435" 
            y2="195" 
            stroke="#f97316" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <line 
            x1="440" 
            y1="183" 
            x2="440" 
            y2="193" 
            stroke="#f97316" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <line 
            x1="445" 
            y1="182" 
            x2="445" 
            y2="192" 
            stroke="#f97316" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </g>

        {/* Hanging hand */}
        <g className={animated ? 'animate-sway' : ''}>
          <circle 
            cx="450" 
            cy="350" 
            r="18" 
            fill="#fed7aa" 
            stroke="#f97316" 
            strokeWidth="2"
          />
          <rect 
            x="435" 
            y="350" 
            width="12" 
            height="35" 
            rx="6" 
            fill="#fed7aa" 
            stroke="#f97316" 
            strokeWidth="2"
          />
          <line 
            x1="438" 
            y1="345" 
            x2="438" 
            y2="355" 
            stroke="#f97316" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <line 
            x1="443" 
            y1="343" 
            x2="443" 
            y2="353" 
            stroke="#f97316" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};