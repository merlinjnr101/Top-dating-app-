import * as React from 'react';
import { useState, useEffect, Suspense, lazy, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  User, 
  Search, 
  LogOut, 
  Shield, 
  Settings, 
  AlertTriangle,
  Menu,
  X,
  Bell,
  Sparkles
} from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from './hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lazy load components
const Discovery = lazy(() => import('./components/Discovery'));
const Matches = lazy(() => import('./components/Matches'));
const Profile = lazy(() => import('./components/Profile'));
const Chat = lazy(() => import('./components/Chat'));
const Auth = lazy(() => import('./components/Auth'));
const Safety = lazy(() => import('./components/Safety'));

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    { path: '/', icon: Search, label: 'Discover' },
    { path: '/matches', icon: Heart, label: 'Matches' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 px-6 py-3 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b md:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">TOP Dating</span>
        </div>
        
        <div className="flex items-center justify-around w-full md:w-auto md:gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? "text-emerald-500 scale-110" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium uppercase tracking-widest md:hidden">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => logout()}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950">
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]"
    >
      <Sparkles className="w-8 h-8 text-white" />
    </motion.div>
  </div>
);

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
        <Navigation />
        <main className={cn(
          "pb-24 md:pb-0 md:pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
          !user && "pb-0 md:pt-0"
        )}>
          <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route 
                  path="/auth" 
                  element={!user ? <Auth /> : <Navigate to={profile ? "/" : "/profile/setup"} />} 
                />
                <Route 
                  path="/" 
                  element={user ? (profile ? <Discovery /> : <Navigate to="/profile/setup" />) : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/matches" 
                  element={user ? <Matches /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/chat/:matchId" 
                  element={user ? <Chat /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/chat" 
                  element={user ? <Matches /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/profile" 
                  element={user ? <Profile /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/profile/setup" 
                  element={user ? <Profile isSetup /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/safety" 
                  element={<Safety />} 
                />
                <Route 
                  path="*" 
                  element={<Navigate to="/" />} 
                />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}
