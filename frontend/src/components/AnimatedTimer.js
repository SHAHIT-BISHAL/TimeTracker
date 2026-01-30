import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

/**
 * Reusable animated timer component
 * Updates every second when active, shows formatted HH:MM:SS
 */
export default function AnimatedTimer({ clockInTime, isActive }) {
  const [time, setTime] = useState('00:00:00');

  useEffect(() => {
    if (!isActive || !clockInTime) {
      setTime('00:00:00');
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const clockInDate = new Date(clockInTime);
      const diff = Math.floor((now - clockInDate) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [clockInTime, isActive]);

  return (
    <motion.div
      animate={isActive ? { scale: [1, 1.01, 1] } : {}}
      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
      className="text-center"
    >
      <div className={`text-8xl font-bold font-mono tracking-wider ${
        isActive
          ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent'
          : 'text-gray-400'
      }`}>
        {time}
      </div>
      <p className="text-gray-400 mt-4 text-sm flex items-center justify-center gap-2">
        <Clock className="w-4 h-4" />
        {isActive ? 'Time elapsed' : 'Ready to start work'}
      </p>
    </motion.div>
  );
}
