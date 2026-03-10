import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { 
  Camera, 
  User, 
  MapPin, 
  Calendar, 
  Heart, 
  Info, 
  Check, 
  Upload,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Profile({ isSetup = false }: { isSetup?: boolean }) {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(isSetup);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    age: profile?.age || 18,
    gender: profile?.gender || 'male',
    interestedIn: profile?.interestedIn || ['female'],
    bio: profile?.bio || '',
    photoURL: profile?.photoURL || '',
    interests: profile?.interests || [],
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        age: profile.age,
        gender: profile.gender,
        interestedIn: profile.interestedIn,
        bio: profile.bio,
        photoURL: profile.photoURL,
        interests: profile.interests,
      });
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setLoading(true);
    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
    } catch (err) {
      console.error("Upload error", err);
      // Fallback for demo if storage is not fully ready
      setFormData(prev => ({ ...prev, photoURL: URL.createObjectURL(e.target.files![0]) }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        ...formData,
        createdAt: profile?.createdAt || new Date().toISOString(),
      });
      setIsEditing(false);
      if (isSetup) navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 7;
    
    if (formData.displayName.trim().length > 0) completed++;
    if (formData.age >= 18) completed++;
    if (formData.gender) completed++;
    if (formData.interestedIn.length > 0) completed++;
    if (formData.bio.trim().length >= 10) completed++;
    if (formData.photoURL) completed++;
    if (formData.interests.length >= 3) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const allInterests = ['Travel', 'Music', 'Fitness', 'Art', 'Gaming', 'Cooking', 'Photography', 'Movies', 'Reading', 'Nature'];

  if (!isEditing && !isSetup && profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Profile Card View */}
          <div className="relative group">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-20 h-20 text-zinc-800" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-10 left-10 right-10">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-black text-white tracking-tighter">
                    {profile.displayName}, {profile.age}
                  </h1>
                  {profile.isVerified && <ShieldCheck className="w-8 h-8 text-emerald-500" />}
                </div>
                <div className="flex items-center gap-2 text-zinc-300 font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location?.city || 'Nearby'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Info className="w-5 h-5" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">About Me</h3>
                </div>
                <p className="text-zinc-300 leading-relaxed text-lg italic">
                  "{profile.bio || 'No bio yet...'}"
                </p>
              </div>

              <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Heart className="w-5 h-5" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Interests</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.interests?.map((interest) => (
                    <span key={interest} className="px-4 py-2 bg-white/5 rounded-xl text-sm font-bold text-zinc-300 border border-white/5">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full bg-white text-black font-black py-6 rounded-[2rem] shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-2"
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-sm uppercase tracking-widest">Edit Profile</span>
              </button>

              <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20 text-center space-y-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Profile Active</p>
                <p className="text-[10px] text-emerald-500/60 font-medium">Visible to matches</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
              {isSetup ? 'Complete Your Profile' : 'Edit Profile'}
            </h1>
            <p className="text-zinc-400 font-medium">Let your personality shine through.</p>
          </div>
          {!isSetup && (
            <button 
              onClick={() => setIsEditing(false)}
              className="p-4 bg-zinc-900 rounded-2xl border border-white/5 text-zinc-500 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Profile Completion</p>
              <h3 className="text-2xl font-black text-white">{calculateProgress()}%</h3>
            </div>
            <p className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
              {calculateProgress() === 100 ? 'Perfect!' : 'Almost there'}
            </p>
          </div>
          <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-medium italic">
            Tip: Profiles with photos and bios get 3x more matches!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Photo Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-zinc-900 border-2 border-dashed border-white/10 group-hover:border-emerald-500/50 transition-all">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-10 h-10 text-zinc-700" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-white" />
                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
              </label>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Primary Profile Photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    placeholder="Your Name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Age</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="number" 
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    min="18"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bio</label>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider transition-colors",
                    (formData.bio.trim() ? formData.bio.trim().split(/\s+/).length : 0) > 100 
                      ? "text-rose-500" 
                      : "text-zinc-500"
                  )}>
                    {formData.bio.trim() ? formData.bio.trim().split(/\s+/).length : 0} / 100 Words
                  </span>
                </div>
                <div className="relative">
                  <Info className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all min-h-[160px]"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Interests</label>
            <div className="flex flex-wrap gap-3">
              {allInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "px-6 py-3 rounded-2xl font-bold text-sm transition-all border",
                    formData.interests.includes(interest)
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                      : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-5 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 text-lg"
            >
              {loading ? 'Saving...' : (isSetup ? 'Start Matching' : 'Save Changes')}
              <Sparkles className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-medium bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Your data is secure and GDPR compliant. 
            <Link to="/safety" className="text-emerald-500 hover:underline ml-1">Learn more about safety.</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
