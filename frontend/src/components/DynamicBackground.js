import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimeOfDay } from '../utils/timeUtils';
import { getWeather } from '../services/weatherService';

/**
 * Particle Component (Memoized for performance)
 */
const Particle = memo(({ delay, x, y, size }) => (
  <motion.div
    className="absolute rounded-full bg-white/30 blur-sm"
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      top: `${y}%`,
    }}
    animate={{
      y: [-20, 20, -20],
      opacity: [0.1, 0.3, 0.1],
      scale: [1, 1.15, 1],
    }}
    transition={{
      duration: 6 + delay,
      repeat: Infinity,
      delay: delay,
      ease: 'easeInOut',
    }}
  />
));

Particle.displayName = 'Particle';

/**
 * DynamicBackground Component (Performance Optimized)
 * Renders an animated background that adjusts based on:
 * - Time of day (morning, afternoon, evening, night)
 * - Weather conditions (sunny, cloudy, rainy)
 * 
 * Optimizations:
 * - Reduced particle count from 20 to 12
 * - Memoized components to prevent unnecessary re-renders
 * - CSS-based animations instead of JS where possible
 * - Longer update intervals to reduce computation
 */
const DynamicBackground = memo(({ children }) => {
  const [backgroundState, setBackgroundState] = useState({
    timeOfDay: 'morning',
    weather: 'clear'
  });

  // Generate particles once using useMemo
  const particles = useMemo(() => 
    [...Array(12)].map((_, i) => ({
      id: i,
      delay: Math.random() * 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2
    })),
    []
  );

  useEffect(() => {
    const updateBackground = async () => {
      const timeOfDay = getTimeOfDay();
      
      try {
        const weather = await getWeather();
        setBackgroundState({
          timeOfDay,
          weather: weather.condition
        });
      } catch (error) {
        setBackgroundState(prev => ({
          ...prev,
          timeOfDay
        }));
      }
    };

    updateBackground();

    // Update time of day every 5 minutes instead of 1 minute
    const interval = setInterval(() => {
      const newTimeOfDay = getTimeOfDay();
      setBackgroundState(prev => ({
        ...prev,
        timeOfDay: newTimeOfDay
      }));
    }, 5 * 60 * 1000);

    // Refresh weather every 30 minutes
    const weatherInterval = setInterval(updateBackground, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(weatherInterval);
    };
  }, []);

  const getGradient = () => {
    const { timeOfDay, weather } = backgroundState;

    const timeGradients = {
      morning: {
        clear: 'from-sky-50 via-blue-50 to-cyan-50',
        cloudy: 'from-gray-50 via-slate-100 to-blue-50',
        rainy: 'from-slate-100 via-gray-200 to-blue-100'
      },
      afternoon: {
        clear: 'from-blue-50 via-sky-50 to-white',
        cloudy: 'from-slate-50 via-gray-50 to-white',
        rainy: 'from-gray-100 via-slate-200 to-gray-200'
      },
      evening: {
        clear: 'from-orange-50 via-pink-50 to-purple-50',
        cloudy: 'from-gray-200 via-slate-200 to-orange-100',
        rainy: 'from-slate-200 via-gray-300 to-slate-300'
      },
      night: {
        clear: 'from-indigo-950 via-purple-950 to-slate-950',
        cloudy: 'from-slate-900 via-gray-900 to-slate-800',
        rainy: 'from-slate-950 via-gray-950 to-slate-900'
      }
    };

    return timeGradients[timeOfDay]?.[weather] || timeGradients.morning.clear;
  };

  const getOverlayOpacity = () => {
    const { timeOfDay } = backgroundState;
    if (timeOfDay === 'night') return 0.15;
    if (timeOfDay === 'evening') return 0.08;
    return 0.03;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${backgroundState.timeOfDay}-${backgroundState.weather}`}
          className={`fixed inset-0 bg-gradient-to-br ${getGradient()}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      {/* Subtle pattern overlay */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Floating particles effect - reduced and optimized */}
      <div className="fixed inset-0 pointer-events-none">
        {particles.map((particle) => (
          <Particle
            key={particle.id}
            delay={particle.delay}
            x={particle.x}
            y={particle.y}
            size={particle.size}
          />
        ))}
      </div>

      {/* Dark overlay for better text contrast */}
      <div 
        className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-1000"
        style={{ opacity: getOverlayOpacity() }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

DynamicBackground.displayName = 'DynamicBackground';

export default DynamicBackground;
