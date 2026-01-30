import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAEDTTimeComponents, calculateClockAngles } from '../utils/timeUtils';

/**
 * AnimatedClockLogo Component
 * Displays an animated analog clock that reflects real AEDT time
 * Smooth hand movements using requestAnimationFrame
 * Clickable to navigate to dashboard
 */
export default function AnimatedClockLogo({ onClick, size = 60, className = '' }) {
  const [angles, setAngles] = useState({ hourAngle: 0, minuteAngle: 0, secondAngle: 0 });

  useEffect(() => {
    let animationFrameId;

    const updateClock = () => {
      const time = getAEDTTimeComponents();
      const newAngles = calculateClockAngles(time);
      setAngles(newAngles);
      animationFrameId = requestAnimationFrame(updateClock);
    };

    updateClock();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <motion.div
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, rotate: -180 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="drop-shadow-lg"
      >
        {/* Clock face */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="white"
          stroke="currentColor"
          strokeWidth="4"
          className="text-blue-600"
        />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = 100 + 75 * Math.cos(angle);
          const y1 = 100 + 75 * Math.sin(angle);
          const x2 = 100 + 85 * Math.cos(angle);
          const y2 = 100 + 85 * Math.sin(angle);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={i % 3 === 0 ? "3" : "2"}
              className="text-gray-600"
            />
          );
        })}

        {/* Center dot */}
        <circle cx="100" cy="100" r="6" fill="currentColor" className="text-blue-600" />

        {/* Hour hand */}
        <motion.line
          x1="100"
          y1="100"
          x2="100"
          y2="55"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-gray-800"
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${angles.hourAngle}deg)`
          }}
        />

        {/* Minute hand */}
        <motion.line
          x1="100"
          y1="100"
          x2="100"
          y2="35"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-gray-700"
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${angles.minuteAngle}deg)`
          }}
        />

        {/* Second hand */}
        <motion.line
          x1="100"
          y1="100"
          x2="100"
          y2="25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-red-500"
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${angles.secondAngle}deg)`
          }}
        />

        {/* Center cap */}
        <circle cx="100" cy="100" r="4" fill="currentColor" className="text-red-500" />
      </svg>
    </motion.div>
  );
}
