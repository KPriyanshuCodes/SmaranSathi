import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Heart, 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  Award, 
  BookOpen, 
  Compass, 
  ShieldCheck, 
  FileSpreadsheet, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { ForumPost } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

export const CommunityImpactView: React.FC = () => {
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [policyData, setPolicyData] = useState<any | null>(null);

  // New Post Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('Primary Caregiver');
  const [location, setLocation] = useState('Guwahati, Assam');
  const [selectedTag, setSelectedTag] = useState('Sundowning');
  const [isPosting, setIsPosting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRes, pRes] = await Promise.all([
        fetch('/api/community/forum'),
        fetch('/api/community/policy-research')
      ]);

      if (fRes.ok) {
        const data = await fRes.json();
        setForumPosts(data.posts || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPolicyData(pData);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLikePost = async (id: string) => {
    soundEffects.playGentleTap(580);
    try {
      const res = await fetch(`/api/community/forum/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setForumPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, likes: data.likes } : p))
        );
      }
    } catch {
      // Offline fallback
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    soundEffects.playSuccessChime();
    try {
      const res = await fetch('/api/community/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName,
          author_role: authorRole,
          location,
          title: newTitle.trim(),
          content: newContent.trim(),
          tags: [selectedTag, 'North East India']
        })
      });
      if (res.ok) {
        const data = await res.json();
        setForumPosts((prev) => [data.post, ...prev]);
        setNewTitle('');
        setNewContent('');
        setIsPosting(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Community Header */}
      <div className="bg-gradient-to-r from-purple-900 via-violet-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-purple-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-purple-500/20 text-purple-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-purple-400/30 flex items-center gap-1.5 w-fit">
              <Users className="w-3.5 h-3.5 text-purple-300" />
              Community • Collective Support & Research
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Long-Term Impact & Community
            </h2>
            <p className="text-sm text-purple-200 max-w-xl">
              Caregiver peer collective, lived wisdom sharing, and longitudinal epidemiological research modeling dementia curve bending across North East India.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-white/10 px-3.5 py-2 rounded-xl text-purple-100 border border-white/20">
              NER Caregiver Cohort: Active
            </span>
          </div>
        </div>
      </div>

      {/* Longitudinal Graph matching Diagram: 2022 to 2045 */}
      <div className="bg-white rounded-3xl border-2 border-purple-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-black text-gray-900">
                Research & Policy: Longitudinal Dementia Projection (2022 &ndash; 2045)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Comparative forecast: Standard trajectory vs. Early AI-guided multimodal cognitive intervention
            </p>
          </div>

          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full w-fit">
            &darr; 36% Projected Care Burden Reduction
          </span>
        </div>

        {policyData?.longitudinal_data && (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={policyData.longitudinal_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="baseline_prevalence"
                  name="Baseline Dementia Burden (Without Early AI)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="with_early_ai_intervention"
                  name="With Smaran Sathi Culturally Attuned AI"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="caregiver_burnout_index"
                  name="Caregiver Burnout Index"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Policy Recommendations Cards */}
        <div className="grid md:grid-cols-3 gap-3 pt-2">
          {policyData?.policy_recommendations?.map((item: any) => (
            <div key={item.title} className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-700 block">
                {item.target_body}
              </span>
              <h4 className="font-black text-gray-900 text-sm leading-snug">{item.title}</h4>
              <p className="text-gray-600 leading-relaxed text-[11px]">{item.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Caregiver Support Forum matching diagram */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">
                Caregiver Support Forum
              </h3>
              <p className="text-xs text-gray-500">Peer advice, regional tips, and mutual solace</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playGentleTap(500);
              setIsPosting(!isPosting);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow transition-colors cursor-pointer"
          >
            {isPosting ? 'Cancel' : 'Share Experience / Ask Forum'}
          </button>
        </div>

        {/* Post Creation Box */}
        {isPosting && (
          <form onSubmit={handleCreatePost} className="bg-purple-50/70 border-2 border-purple-200 p-5 rounded-2xl space-y-3 animate-in fade-in">
            <h4 className="text-sm font-black text-purple-950">New Caregiver Community Post</h4>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Managing sunset confusion with soothing Bihu tunes"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Theme Tag</label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl font-bold"
                >
                  <option value="Sundowning">Sundowning & Evening Restlessness</option>
                  <option value="Folk Music">Folk Music & Reminiscence</option>
                  <option value="Family Photo">Familiar Faces & Photo Albums</option>
                  <option value="Dietary Routine">Herbal Teas & Hydration</option>
                  <option value="Caregiver Respite">Caregiver Mental Respite</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">Your Wisdom or Question</label>
              <textarea
                required
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share what worked for your family in Assam, Meghalaya, etc..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl font-medium"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow cursor-pointer"
              >
                Publish to Caregiver Forum
              </button>
            </div>
          </form>
        )}

        {/* Forum Feed */}
        <div className="space-y-3">
          {forumPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 sm:p-5 rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all bg-white shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-gray-900 text-base">{post.title}</span>
                    <div className="flex gap-1">
                      {post.tags.map((t) => (
                        <span key={t} className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mt-1">
                    <span className="text-gray-900 font-bold">{post.author_name}</span>
                    <span>&bull; {post.author_role}</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {post.location}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleLikePost(post.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-xl text-xs font-bold border border-gray-200 transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{post.likes}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                {post.content}
              </p>

              <div className="text-[11px] text-gray-400 pt-1">
                Posted on {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
