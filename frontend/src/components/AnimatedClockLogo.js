import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { getAEDTTimeComponents, calculateClockAngles } from '../utils/timeUtils';

/**
 * AnimatedClockLogo Component (Performance Optimized)
 * Displays an animated analog clock that reflects real AEDT time
 * Uses CSS transforms for smooth 60fps animations
 * Memoized to prevent unnecessary re-renders
 */
const AnimatedClockLogo = memo(({ onClick, size = 60, className = '' }) => {
  const [angles, setAngles] = useState({ hourAngle: 0, minuteAngle: 0, secondAngle: 0 });
  const rafRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const updateClock = (timestamp) => {
      // Throttle updates to ~30fps for smoother performance (every ~33ms)
      if (timestamp - lastUpdateRef.current >= 33) {
        const time = getAEDTTimeComponents();
        const newAngles = calculateClockAngles(time);
        setAngles(newAngles);
        lastUpdateRef.current = timestamp;
      }
      rafRef.current = requestAnimationFrame(updateClock);
    };

    rafRef.current = requestAnimationFrame(updateClock);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className={`cursor-pointer select-none ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="drop-shadow-md"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Clock face with gradient */}
        <defs>
          <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
          </filter>
        </defs>

        <circle
          cx="100"
          cy="100"
          r="95"
          fill="url(#clockGradient)"
          stroke="#3b82f6"
          strokeWidth="3"
          filter="url(#shadow)"
        />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const isMainMarker = i % 3 === 0;
          const innerRadius = isMainMarker ? 70 : 80;
          const outerRadius = 88;
          const x1 = 100 + innerRadius * Math.cos(angle);
          const y1 = 100 + innerRadius * Math.sin(angle);
          const x2 = 100 + outerRadius * Math.cos(angle);
          const y2 = 100 + outerRadius * Math.sin(angle);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isMainMarker ? "#1e40af" : "#60a5fa"}
              strokeWidth={isMainMarker ? "3" : "2"}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="55"
          stroke="#1e293b"
          strokeWidth="7"
          strokeLinecap="round"
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${angles.hourAngle}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />

        {/* Minute hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="35"
          stroke="#334155"
          strokeWidth="5"
          strokeLinecap="round"
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${angles.minuteAngle}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />

        {/* Second hand with smoother animation */}
        <line
          x1="100"
          y1="105"
          x2="100"
          y2="25"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${angles.secondAngle}deg)`,
            transition: 'transform 0.1s linear'
          }}
        />

        {/* Center hub */}
        <circle cx="100" cy="100" r="8" fill="#1e293b" />
        <circle cx="100" cy="100" r="5" fill="#ef4444" />
      </svg>
    </motion.div>
  );
});

AnimatedClockLogo.displayName = 'AnimatedClockLogo';

export default AnimatedClockLogo;
