import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, UserCheck, Lock, EyeOff, MessageSquareOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Safety() {
  const safetyTips = [
    {
      icon: ShieldCheck,
      title: "Verified Profiles",
      description: "Look for the emerald shield badge. These users have verified their identity with a valid ID.",
      color: "text-emerald-500"
    },
    {
      icon: Lock,
      title: "Secure Messaging",
      description: "Our chat is encrypted and monitored by AI to detect suspicious links or scam patterns.",
      color: "text-blue-500"
    },
    {
      icon: EyeOff,
      title: "Privacy Controls",
      description: "You control who sees your profile. You can hide your online status or distance at any time.",
      color: "text-purple-500"
    },
    {
      icon: MessageSquareOff,
      title: "Zero Tolerance",
      description: "We have a zero-tolerance policy for harassment, fake accounts, and financial scams.",
      color: "text-red-500"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20"
        >
          <ShieldCheck className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h1 className="text-5xl font-black tracking-tighter text-white mb-4 italic uppercase">Safety Center</h1>
        <p className="text-zinc-400 font-medium max-w-lg mx-auto">Your safety is our top priority. Learn how we keep TOP Dating secure for everyone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safetyTips.map((tip, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-zinc-900 border border-white/5 rounded-[2.5rem] hover:bg-zinc-800 transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${tip.color}`}>
              <tip.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">{tip.title}</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">{tip.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center shrink-0 border border-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Report a Concern</h3>
          <p className="text-zinc-500 font-medium mb-4">If you encounter a suspicious profile or feel unsafe, report it immediately. Our team reviews all reports within 24 hours.</p>
          <button className="px-8 py-3 bg-red-500 text-white font-black rounded-2xl shadow-xl hover:bg-red-600 transition-all">
            Contact Safety Team
          </button>
        </div>
      </div>
    </div>
  );
}
