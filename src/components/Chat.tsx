import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image, 
  Mic, 
  MoreVertical, 
  ArrowLeft, 
  ShieldAlert, 
  Flag, 
  Ban,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { Message, UserProfile, Match } from '../types';
import { format } from 'date-fns';

const MessageBubble = ({ message, isMe }: { message: Message, isMe: boolean, key?: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}
  >
    <div className={`max-w-[75%] px-6 py-4 rounded-[2rem] shadow-xl ${
      isMe 
        ? 'bg-emerald-500 text-white rounded-tr-none' 
        : 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-white/5'
    }`}>
      <p className="text-sm font-medium leading-relaxed">{message.text}</p>
      <div className={`flex items-center gap-1 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-zinc-500'}`}>
          {message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '...'}
        </span>
        {isMe && (
          message.read ? <CheckCheck className="w-3 h-3 text-white/80" /> : <Check className="w-3 h-3 text-white/40" />
        )}
      </div>
    </div>
  </motion.div>
);

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId || !user) return;

    // Fetch Match & Other User
    const fetchMatchInfo = async () => {
      const matchSnap = await getDoc(doc(db, 'matches', matchId));
      if (matchSnap.exists()) {
        const data = matchSnap.data() as Match;
        setMatch(data);
        const otherUserId = data.users.find(id => id !== user.uid);
        if (otherUserId) {
          const userSnap = await getDoc(doc(db, 'users', otherUserId));
          if (userSnap.exists()) {
            setOtherUser(userSnap.data() as UserProfile);
          }
        }
      }
    };

    fetchMatchInfo();

    // Fetch Messages
    const q = query(
      collection(db, 'matches', matchId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(fetchedMessages);
      
      // Mark as read
      snapshot.docs.forEach(async (d) => {
        const msg = d.data() as Message;
        if (msg.senderId !== user.uid && !msg.read) {
          await updateDoc(doc(db, 'matches', matchId, 'messages', d.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [matchId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !matchId) return;

    const text = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, 'matches', matchId, 'messages'), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
        read: false
      });

      await updateDoc(doc(db, 'matches', matchId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (reason: string) => {
    if (!user || !otherUser) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reportedId: otherUser.uid,
        reason,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      alert('User reported. Our safety team will review this shortly.');
      setShowReport(false);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlock = async () => {
    if (!user || !otherUser) return;
    try {
      await addDoc(collection(db, 'blocks'), {
        blockerId: user.uid,
        blockedId: otherUser.uid,
        createdAt: serverTimestamp()
      });
      alert('User blocked.');
      navigate('/matches');
    } catch (err) {
      console.error(err);
    }
  };

  if (!otherUser) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-zinc-950 border-x border-white/5">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/matches" className="p-2 text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/30">
              <img src={otherUser.photoURL || null} alt={otherUser.displayName} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">{otherUser.displayName}</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Online</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl p-2 z-50"
              >
                <button 
                  onClick={() => setShowReport(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Flag className="w-4 h-4" />
                  Report User
                </button>
                <button 
                  onClick={handleBlock}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Ban className="w-4 h-4" />
                  Block User
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-2 scrollbar-hide">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto mb-4 border-2 border-emerald-500/30 shadow-2xl">
            <img src={otherUser.photoURL || null} alt={otherUser.displayName} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">You matched with {otherUser.displayName}</h2>
          <p className="text-zinc-500 text-sm font-medium">Say something nice to start the conversation!</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full w-fit mx-auto border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            AI Safety Verified
          </div>
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMe={msg.senderId === user?.uid} />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-zinc-950 border-t border-white/5">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-zinc-900 border border-white/5 rounded-3xl py-4 pl-6 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
            />
            <button 
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
        <div className="flex items-center justify-around mt-4 px-4">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Image className="w-5 h-5" /></button>
          <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Mic className="w-5 h-5" /></button>
          <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Paperclip className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Report User</h2>
              <p className="text-zinc-500 font-medium mb-8">Why are you reporting {otherUser.displayName}? Your report is anonymous.</p>
              
              <div className="space-y-3">
                {['Fake Account', 'Harassment', 'Inappropriate Content', 'Scam/Spam', 'Other'].map((reason) => (
                  <button 
                    key={reason}
                    onClick={() => handleReport(reason)}
                    className="w-full text-left px-6 py-4 bg-zinc-950 border border-white/5 rounded-2xl font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowReport(false)}
                className="w-full mt-8 py-4 text-zinc-500 font-bold hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
