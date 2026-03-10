import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Mail, Lock, Sparkles, Chrome, Phone, Apple, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock authentication logic
    setTimeout(() => {
      try {
        // Simple mock: any email/password works
        const mockUser = {
          uid: btoa(email).slice(0, 20), // Simple deterministic UID from email
          email: email,
          displayName: email.split('@')[0],
          photoURL: `https://picsum.photos/seed/${email}/200/200`
        };
        login(mockUser);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setTimeout(() => {
      const mockUser = {
        uid: 'google_mock_user_123',
        email: 'google_user@example.com',
        displayName: 'Google User',
        photoURL: 'https://picsum.photos/seed/google/200/200'
      };
      login(mockUser);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">TOP DATING</h1>
          <p className="text-zinc-400 font-medium">Find your perfect match with AI precision.</p>
          <div className="mt-4 inline-block px-4 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-bold uppercase tracking-widest">
            Demo Mode: Any login works
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex gap-4 mb-8 p-1 bg-zinc-950 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-zinc-900 px-4 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center p-4 bg-zinc-950 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-colors"
            >
              <Chrome className="w-6 h-6 text-white" />
            </button>
            <button className="flex items-center justify-center p-4 bg-zinc-950 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-colors">
              <Apple className="w-6 h-6 text-white" />
            </button>
            <button className="flex items-center justify-center p-4 bg-zinc-950 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-colors">
              <Phone className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Local session storage enabled
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
