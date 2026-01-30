import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimeOfDay } from '../utils/timeUtils';
import { getWeather } from '../services/weatherService';

/**
 * DynamicBackground Component
 * Renders an animated background that adjusts based on:
 * - Time of day (morning, afternoon, evening, night)
 * - Weather conditions (sunny, cloudy, rainy)
 * 
 * Transitions are smooth and animated using Framer Motion
 */
export default function DynamicBackground({ children }) {
  const [backgroundState, setBackgroundState] = useState({
    timeOfDay: 'morning',
    weather: 'clear'
  });

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
        // Fallback to time-only background
        setBackgroundState(prev => ({
          ...prev,
          timeOfDay
        }));
      }
    };

    updateBackground();

    // Update time of day every minute
    const interval = setInterval(() => {
      const newTimeOfDay = getTimeOfDay();
      setBackgroundState(prev => ({
        ...prev,
        timeOfDay: newTimeOfDay
      }));
    }, 60000);

    // Refresh weather every 30 minutes
    const weatherInterval = setInterval(updateBackground, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(weatherInterval);
    };
  }, []);

  const getGradient = () => {
    const { timeOfDay, weather } = backgroundState;

    // Base gradients for time of day
    const timeGradients = {
      morning: {
        clear: 'from-blue-50 via-blue-100 to-cyan-100',
        cloudy: 'from-gray-100 via-gray-200 to-blue-100',
        rainy: 'from-gray-200 via-gray-300 to-blue-200'
      },
      afternoon: {
        clear: 'from-sky-100 via-blue-50 to-white',
        cloudy: 'from-gray-100 via-slate-100 to-gray-50',
        rainy: 'from-slate-200 via-gray-300 to-slate-300'
      },
      evening: {
        clear: 'from-orange-100 via-pink-100 to-purple-100',
        cloudy: 'from-gray-300 via-slate-300 to-orange-200',
        rainy: 'from-slate-300 via-gray-400 to-slate-400'
      },
      night: {
        clear: 'from-indigo-900 via-purple-900 to-slate-900',
        cloudy: 'from-slate-800 via-gray-800 to-slate-700',
        rainy: 'from-slate-900 via-gray-900 to-slate-800'
      }
    };

    return timeGradients[timeOfDay]?.[weather] || timeGradients.morning.clear;
  };

  const getOverlayOpacity = () => {
    const { timeOfDay } = backgroundState;
    
    // Darker overlay for night to improve text readability
    if (timeOfDay === 'night') return 0.2;
    if (timeOfDay === 'evening') return 0.1;
    return 0.05;
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
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Subtle pattern overlay */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Dark overlay for better text contrast */}
      <div 
        className="fixed inset-0 bg-black pointer-events-none"
        style={{ opacity: getOverlayOpacity() }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
