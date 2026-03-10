import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  Heart, 
  Search, 
  MoreVertical, 
  ShieldAlert,
  Sparkles,
  Clock,
  Plus,
  Camera,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, UserProfile, Status } from '../types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const MatchItem = ({ match, currentUserId, otherUser: initialOtherUser }: { match: Match, currentUserId: string, otherUser?: UserProfile, key?: any }) => {
  const [otherUser, setOtherUser] = useState<UserProfile | null>(initialOtherUser || null);
  const [loading, setLoading] = useState(!initialOtherUser);

  useEffect(() => {
    if (initialOtherUser) return;
    const otherUserId = match.users.find(id => id !== currentUserId);
    if (!otherUserId) return;

    const fetchUser = async () => {
      const userSnap = await getDoc(doc(db, 'users', otherUserId));
      if (userSnap.exists()) {
        setOtherUser(userSnap.data() as UserProfile);
      }
      setLoading(false);
    };

    fetchUser();
  }, [match, currentUserId, initialOtherUser]);

  if (loading || !otherUser) return (
    <div className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse border border-white/5" />
  );

  return (
    <Link to={`/chat/${match.id}`} className="group block">
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-all shadow-lg"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-colors">
            <img src={otherUser.photoURL || null} alt={otherUser.displayName} className="w-full h-full object-cover" />
          </div>
          {otherUser.lastActive && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-900 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-black text-white truncate tracking-tight">{otherUser.displayName}</h3>
            {match.lastMessageAt && (
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(match.lastMessageAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm font-medium truncate">
            {match.lastMessage || `You matched with ${otherUser.displayName}! Say hi.`}
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-colors">
          <MessageCircle className="w-5 h-5" />
        </div>
      </motion.div>
    </Link>
  );
};

export default function Matches() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<(Match & { otherUser?: UserProfile })[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const matchDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];

      // Fetch other user profiles for filtering and display
      const matchesWithUsers = await Promise.all(matchDocs.map(async (match) => {
        const otherUserId = match.users.find(id => id !== user.uid);
        if (otherUserId) {
          const userSnap = await getDoc(doc(db, 'users', otherUserId));
          if (userSnap.exists()) {
            return { ...match, otherUser: userSnap.data() as UserProfile };
          }
        }
        return match;
      }));

      setMatches(matchesWithUsers);
      setLoading(false);
    });

    // Fetch active statuses (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const statusQuery = query(
      collection(db, 'statuses'),
      where('createdAt', '>=', yesterday.toISOString()),
      orderBy('createdAt', 'desc')
    );

    const statusUnsubscribe = onSnapshot(statusQuery, (snapshot) => {
      const fetchedStatuses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Status[];
      setStatuses(fetchedStatuses);
    });

    return () => {
      unsubscribe();
      statusUnsubscribe();
    };
  }, [user]);

  const handlePostStatus = async () => {
    if (!user || !profile || !newStatus.trim()) return;
    
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, 'statuses'), {
        userId: user.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        content: newStatus,
        type: 'text',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });
      setNewStatus('');
      setShowStatusModal(false);
    } catch (err) {
      console.error("Error posting status", err);
    }
  };

  const filteredMatches = matches.filter(m => 
    m.otherUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">Your Matches</h1>
          <p className="text-zinc-400 font-medium">Start a conversation with your connections.</p>
        </div>
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
          <Heart className="w-6 h-6 text-emerald-500 fill-emerald-500" />
        </div>
      </div>

      {/* Statuses Section */}
      <div className="mb-12 overflow-x-auto no-scrollbar flex gap-4 pb-4">
        <button 
          onClick={() => setShowStatusModal(true)}
          className="flex-shrink-0 flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-emerald-500 transition-all">
            <Plus className="w-6 h-6 text-zinc-500 group-hover:text-emerald-500" />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Post Status</span>
        </button>

        {statuses.map((status) => (
          <button 
            key={status.id} 
            onClick={() => setSelectedStatus(status)}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 p-0.5 group-hover:scale-105 transition-transform">
              <img src={status.photoURL || null} alt={status.displayName} className="w-full h-full object-cover rounded-[0.9rem]" />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate w-16 text-center">
              {status.displayName}
            </span>
          </button>
        ))}
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search matches by name or message..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
        />
      </div>

      {/* Status Viewer Modal */}
      <AnimatePresence>
        {selectedStatus && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStatus(null)}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-0"
          >
            <div className="relative w-full h-full max-w-lg bg-zinc-950 flex flex-col">
              {/* Progress Bar */}
              <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    onAnimationComplete={() => setSelectedStatus(null)}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              {/* Header */}
              <div className="p-8 pt-12 flex items-center gap-4 z-10">
                <img src={selectedStatus.photoURL || null} alt="" className="w-10 h-10 rounded-full border-2 border-white" />
                <div>
                  <h4 className="text-white font-bold">{selectedStatus.displayName}</h4>
                  <p className="text-white/60 text-xs">{formatDistanceToNow(new Date(selectedStatus.createdAt), { addSuffix: true })}</p>
                </div>
                <button onClick={() => setSelectedStatus(null)} className="ml-auto text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center p-12 text-center">
                <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
                  {selectedStatus.content}
                </h2>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Post Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white tracking-tight">Post a Status</h3>
                <button onClick={() => setShowStatusModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <textarea 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all min-h-[120px]"
              />
              <div className="flex gap-4">
                <button className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photo
                </button>
                <button 
                  onClick={handlePostStatus}
                  className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all"
                >
                  Post Status
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-white/5 rounded-[2.5rem]">
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Sparkles className="w-10 h-10 text-zinc-700" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">No matches yet</h2>
          <p className="text-zinc-500 font-medium max-w-xs mx-auto">Keep swiping to find your perfect match!</p>
          <Link 
            to="/"
            className="mt-8 inline-block px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform"
          >
            Start Discovering
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <MatchItem 
              key={match.id} 
              match={match} 
              currentUserId={user!.uid} 
              otherUser={match.otherUser}
            />
          ))}
        </div>
      )}

      <div className="mt-12 p-6 bg-zinc-900/50 border border-white/5 rounded-3xl flex items-center gap-4">
        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
          <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white tracking-tight">Safety First</h4>
          <p className="text-xs text-zinc-500 font-medium">Never share personal financial information. Report suspicious behavior immediately.</p>
        </div>
      </div>
    </div>
  );
}
