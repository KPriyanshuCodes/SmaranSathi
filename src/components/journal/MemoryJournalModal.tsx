import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Mic, 
  Square, 
  Image as ImageIcon, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Plus, 
  Heart, 
  Sparkles, 
  Calendar, 
  MapPin, 
  X,
  Smile,
  Music,
  Camera,
  Play,
  Pause
} from 'lucide-react';
import { MemoryJournalEntry, RegionalLanguage } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface MemoryJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  patientName?: string;
  currentLanguage?: RegionalLanguage;
  isElderlyMode?: boolean;
}

const NER_PROMPTS = [
  'A memorable trip across the Brahmaputra River ferry',
  'Walking through fragrant tea gardens in springtime',
  'Morning prayers with family at Kamakhya or Umananda',
  'Singing traditional Bihu or Khasi folk songs by the fireplace',
  'Cherrapunjee hill mist and collecting wild berries',
  'Watching hornbills fly over Kohima hills in winter'
];

export const MemoryJournalModal: React.FC<MemoryJournalModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  patientName,
  currentLanguage = 'as',
  isElderlyMode = false
}) => {
  const displayName = patientName || userName || 'Beloved Elder';
  const [entries, setEntries] = useState<MemoryJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'audio' | 'photo'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [locationTag, setLocationTag] = useState('Guwahati, Assam');
  const [emotion, setEmotion] = useState<'joy' | 'peaceful' | 'nostalgic' | 'reflective'>('nostalgic');

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/journal/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.journals || []);
      }
    } catch (err) {
      console.error('Failed to load journals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJournals();
    }
  }, [isOpen, userId]);

  // Simulated Voice Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStartRecording = () => {
    soundEffects.playGentleTap(520);
    setIsRecording(true);
    setMediaType('audio');
  };

  const handleStopRecording = () => {
    soundEffects.playSuccessChime();
    setIsRecording(false);
    if (!title) {
      setTitle(`Spoken Reminiscence (${recordingSeconds}s)`);
    }
    if (!content) {
      setContent(`Dadaji recounted a heartfelt story in his own voice about peaceful moments in ${locationTag}.`);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    soundEffects.playSuccessChime();

    const newEntryPayload = {
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      media_type: mediaType,
      media_url: mediaUrl || (mediaType === 'photo' ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80' : undefined),
      audio_duration: mediaType === 'audio' ? `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds || 32}` : undefined,
      location_tag: locationTag,
      emotion: emotion
    };

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntryPayload)
      });
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => [data.journal, ...prev]);
        setIsAdding(false);
        setTitle('');
        setContent('');
        setMediaUrl('');
      }
    } catch (err) {
      console.error('Error saving memory entry', err);
    }
  };

  const handleDelete = async (id: string) => {
    soundEffects.playGentleTap(350);
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Speech Synthesizer for Audio Reminiscence playback
  const handlePlayVoice = (entry: MemoryJournalEntry) => {
    if (playingId === entry.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingId(entry.id);
    soundEffects.playGentleTap(580);

    const utterance = new SpeechSynthesisUtterance(
      `${entry.title}. ${entry.content}`
    );
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#FCF8F1] border-2 border-amber-500 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                Ecosystem Activity • Memory Reminiscence
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950 leading-tight">
                {userName}&apos;s Memory Journal
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-amber-200/60 text-amber-900 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs sm:text-sm font-bold text-amber-900">
            Nostalgic storytelling and oral history preservation for North East India
          </p>
          {!isAdding && (
            <button
              onClick={() => {
                soundEffects.playGentleTap(520);
                setIsAdding(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Memory</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="p-5 sm:p-7 space-y-6 flex-1">
          {/* New Memory Form */}
          {isAdding && (
            <form onSubmit={handleSaveEntry} className="bg-white border-2 border-amber-400 p-5 sm:p-6 rounded-2xl shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <h3 className="font-black text-amber-950 text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Capture Nostalgic Moment
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>

              {/* Inspiration Prompt Chips */}
              <div>
                <label className="block text-xs font-black text-amber-900 uppercase tracking-wide mb-1.5">
                  NER Inspiration Prompts:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {NER_PROMPTS.slice(0, 3).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        soundEffects.playGentleTap(450);
                        setTitle(prompt);
                      }}
                      className="text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold px-2.5 py-1 rounded-full text-left"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Location */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Tea garden walks in Dibrugarh"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-amber-200 rounded-xl font-bold text-gray-900 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                    Place / Regional Landmark
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-amber-600" />
                    <input
                      type="text"
                      value={locationTag}
                      onChange={(e) => setLocationTag(e.target.value)}
                      placeholder="e.g. Shillong, Meghalaya"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-amber-200 rounded-xl font-bold text-gray-900 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Media Type & Audio Voice Recorder */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMediaType('text')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
                    mediaType === 'text' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Written Story
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('audio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
                    mediaType === 'audio' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Voice Note (Audio)
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('photo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
                    mediaType === 'photo' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Photo Memory
                </button>
              </div>

              {/* Voice Recorder Bar */}
              {mediaType === 'audio' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-600 animate-ping' : 'bg-gray-400'}`} />
                    <span className="text-xs font-black text-amber-950">
                      {isRecording ? `Recording voice: 0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}` : 'Click mic to record oral history'}
                    </span>
                  </div>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Record Voice
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-black text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Finish & Save Voice
                    </button>
                  )}
                </div>
              )}

              {/* Photo URL if selected */}
              {mediaType === 'photo' && (
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                    Photo Image URL or Preset
                  </label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-amber-200 rounded-xl font-bold text-gray-900"
                  />
                </div>
              )}

              {/* Narrative Content */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                  Story Details & Emotional Memory
                </label>
                <textarea
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the sounds, smells, people present, and feelings..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-amber-200 rounded-xl font-medium text-gray-900 focus:border-amber-500"
                />
              </div>

              {/* Emotion Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-700">Tone:</span>
                {(['joy', 'nostalgic', 'peaceful', 'reflective'] as const).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmotion(em)}
                    className={`px-2.5 py-1 rounded-full text-xs font-black capitalize border ${
                      emotion === em ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-black shadow transition-colors cursor-pointer"
                >
                  Save to Memory Journal
                </button>
              </div>
            </form>
          )}

          {/* Entries Feed */}
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-bold">
              Loading memory journal logs...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-amber-200 p-8">
              <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h4 className="text-base font-black text-amber-950">No Memories Logged Yet</h4>
              <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                Begin logging memorable stories, tea garden walks, childhood festivals, or voice recordings to stimulate semantic recall.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {entries.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border-2 border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col sm:flex-row gap-4"
                >
                  {/* Photo Thumbnail if available */}
                  {item.media_url && (
                    <div className="sm:w-36 sm:h-36 h-48 rounded-xl overflow-hidden shrink-0 border border-amber-200 bg-amber-50">
                      <img
                        src={item.media_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Text and Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base sm:text-lg font-black text-amber-950">
                            {item.title}
                          </h4>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {item.emotion}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            {item.location_tag || 'North East India'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                      {item.content}
                    </p>

                    {/* Audio Playback Controls */}
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handlePlayVoice(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer ${
                          playingId === item.id
                            ? 'bg-amber-700 text-white animate-pulse'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                        }`}
                      >
                        {playingId === item.id ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Voice Playback</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Listen to Voice Story</span>
                          </>
                        )}
                      </button>

                      {item.audio_duration && (
                        <span className="text-[11px] font-bold text-gray-500">
                          Audio Length: {item.audio_duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
