import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Heart, 
  X, 
  Info, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  MessageCircle,
  Filter,
  Check
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SwipeCard = ({ user, onSwipe }: { user: UserProfile, onSwipe: (direction: 'left' | 'right') => void, key?: any }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const heartOpacity = useTransform(x, [50, 150], [0, 1]);
  const xOpacity = useTransform(x, [-150, -50], [1, 0]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 group">
        <img 
          src={user.photoURL || null} 
          alt={user.displayName} 
          className="w-full h-full object-cover pointer-events-none"
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        {/* Swipe Indicators */}
        <motion.div style={{ opacity: heartOpacity }} className="absolute top-10 left-10 border-4 border-emerald-500 rounded-2xl px-6 py-2 rotate-[-20deg]">
          <span className="text-emerald-500 text-4xl font-black uppercase tracking-widest">LIKE</span>
        </motion.div>
        <motion.div style={{ opacity: xOpacity }} className="absolute top-10 right-10 border-4 border-red-500 rounded-2xl px-6 py-2 rotate-[20deg]">
          <span className="text-red-500 text-4xl font-black uppercase tracking-widest">NOPE</span>
        </motion.div>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-4xl font-black text-white tracking-tight">{user.displayName}, {user.age}</h2>
                {user.isVerified && (
                  <div className="bg-emerald-500 p-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-zinc-400 font-medium">
                <MapPin className="w-4 h-4" />
                <span>{user.location?.city || 'Nearby'}</span>
              </div>
            </div>
            <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/20 transition-colors">
              <Info className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.interests.slice(0, 3).map((interest) => (
              <span key={interest} className="px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white uppercase tracking-widest">
                {interest}
              </span>
            ))}
          </div>

          <p className="text-zinc-300 text-sm line-clamp-2 font-medium leading-relaxed">
            {user.bio}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function Discovery() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchData, setMatchData] = useState<UserProfile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const allInterests = ['Travel', 'Music', 'Fitness', 'Art', 'Gaming', 'Cooking', 'Photography', 'Movies', 'Reading', 'Nature'];

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !profile) return;
      setLoading(true);
      try {
        let q = query(
          collection(db, 'users'),
          where('uid', '!=', user.uid),
        );

        const querySnapshot = await getDocs(q);
        let fetchedUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        
        // Client-side filtering for interests to allow complex combinations
        if (selectedInterests.length > 0) {
          fetchedUsers = fetchedUsers.filter(u => 
            u.interests.some(interest => selectedInterests.includes(interest))
          );
        }

        setUsers(fetchedUsers);
        setCurrentIndex(0); // Reset index when filters change
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, profile, selectedInterests]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || !profile) return;
    const targetUser = users[currentIndex];

    if (direction === 'right') {
      // Check for mutual like
      const likeRef = doc(db, 'likes', `${user.uid}_${targetUser.uid}`);
      await setDoc(likeRef, {
        from: user.uid,
        to: targetUser.uid,
        createdAt: serverTimestamp()
      });

      // Check if they liked us back
      const reverseLikeRef = doc(db, 'likes', `${targetUser.uid}_${user.uid}`);
      const reverseLikeSnap = await getDoc(reverseLikeRef);

      if (reverseLikeSnap.exists()) {
        // IT'S A MATCH!
        const matchRef = await addDoc(collection(db, 'matches'), {
          users: [user.uid, targetUser.uid],
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp()
        });
        setMatchData(targetUser);
      }
    }

    setCurrentIndex(prev => prev + 1);
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
      />
    </div>
  );

  if (currentIndex >= users.length) return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
        <Sparkles className="w-12 h-12 text-zinc-700" />
      </div>
      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">No more matches nearby</h2>
      <p className="text-zinc-500 font-medium max-w-xs">Try expanding your search distance or changing your preferences.</p>
      <button 
        onClick={() => setCurrentIndex(0)}
        className="mt-8 px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform"
      >
        Refresh Discovery
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-[80vh] relative py-8">
      {/* Header with Filter Toggle */}
      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-2xl font-black text-white tracking-tighter italic">DISCOVER</h1>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-3 rounded-2xl border transition-all flex items-center gap-2",
            selectedInterests.length > 0 || showFilters
              ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white"
          )}
        >
          <Filter className="w-5 h-5" />
          {selectedInterests.length > 0 && (
            <span className="text-xs font-black bg-white text-emerald-500 w-5 h-5 rounded-full flex items-center justify-center">
              {selectedInterests.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 right-4 z-[60] bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Filter by Interests</h3>
              <button 
                onClick={() => setSelectedInterests([])}
                className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2",
                    selectedInterests.includes(interest)
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10"
                  )}
                >
                  {interest}
                  {selectedInterests.includes(interest) && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowFilters(false)}
              className="w-full py-4 bg-white text-black font-black rounded-2xl text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Apply Filters
            </button>
          </motion.div>
        )}

        {matchData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"
          >
            <div className="text-center space-y-8">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block p-4 bg-emerald-500 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.6)]"
              >
                <Heart className="w-12 h-12 text-white fill-white" />
              </motion.div>
              <h2 className="text-6xl font-black text-white tracking-tighter italic">IT'S A MATCH!</h2>
              <div className="flex items-center justify-center gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden">
                  <img src={profile?.photoURL || null} alt="You" className="w-full h-full object-cover" />
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden">
                  <img src={matchData.photoURL || null} alt={matchData.displayName} className="w-full h-full object-cover" />
                </div>
              </div>
              <p className="text-zinc-400 text-lg font-medium">You and {matchData.displayName} liked each other.</p>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setMatchData(null)}
                  className="px-12 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send a Message
                </button>
                <button 
                  onClick={() => setMatchData(null)}
                  className="text-zinc-500 font-bold hover:text-white transition-colors"
                >
                  Keep Swiping
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full">
        {users.slice(currentIndex, currentIndex + 2).reverse().map((u, i) => (
          <SwipeCard 
            key={u.uid} 
            user={u} 
            onSwipe={handleSwipe} 
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-6">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-red-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
        >
          <X className="w-8 h-8" />
        </button>
        <button className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-blue-500 shadow-xl hover:scale-110 active:scale-95 transition-all">
          <Star className="w-6 h-6" />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-emerald-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
        >
          <Heart className="w-8 h-8 fill-current" />
        </button>
      </div>
    </div>
  );
}
