import React, { useState } from 'react';
import { ArrowLeft, Volume2, Phone, Heart, Sparkles, Download, X, Eye, Check } from 'lucide-react';
import { FamiliarPerson, RegionalLanguage } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { speakText, soundEffects } from '../../utils/speechAndAudio';
import { downloadPhoto } from '../../utils/downloadPhoto';

interface FamiliarPeopleViewProps {
  people: FamiliarPerson[];
  language: RegionalLanguage;
  onBack: () => void;
}

export const FamiliarPeopleView: React.FC<FamiliarPeopleViewProps> = ({
  people,
  language,
  onBack,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const [selectedPhotoPerson, setSelectedPhotoPerson] = useState<FamiliarPerson | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const handleSpeakPerson = (person: FamiliarPerson) => {
    const textToSpeak = person.voice_prompt || `${person.name}, your beloved ${person.relation}. ${person.notes || ''}`;
    speakText(textToSpeak, language);
  };

  const handleDownload = async (person: FamiliarPerson, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.playGentleTap();
    setDownloadingId(person.id);
    const fileName = `${person.name.toLowerCase().replace(/\s+/g, '-')}-${person.relation.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    await downloadPhoto(person.photo_url, fileName);
    soundEffects.playSuccessChime();
    setDownloadingId(null);
    setDownloadSuccessId(person.id);
    setTimeout(() => setDownloadSuccessId(null), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white/90 p-4 rounded-3xl border-2 border-amber-200 shadow-sm backdrop-blur">
        <button
          id="family-back-btn"
          onClick={onBack}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-stone-800 transition-transform active:scale-95"
        >
          <ArrowLeft className="w-7 h-7 text-stone-900" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 flex items-center justify-center gap-2">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <span>{t.face_match}</span>
          </h2>
          <p className="text-stone-600 font-semibold text-sm md:text-base">
            Your loving family and trusted friends
          </p>
        </div>

        <button
          onClick={() => speakText('Here are your loving family members and friends. Tap on anyone to hear their voice or save their photograph.', language)}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shadow-sm transition-transform active:scale-95"
          title="Listen to instructions"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {people.map((person) => (
          <div
            key={person.id}
            id={`person-card-${person.id}`}
            className="bg-white rounded-3xl p-6 border-4 border-amber-200 shadow-md flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all group"
          >
            <div className="flex items-start gap-5">
              <div 
                onClick={() => setSelectedPhotoPerson(person)}
                className="relative cursor-pointer shrink-0 rounded-2xl overflow-hidden border-4 border-amber-300 shadow-md group-hover:shadow-lg transition-all"
                title="Click to view & download full-size photo"
              >
                <img
                  src={person.photo_url}
                  alt={person.name}
                  className="w-24 h-24 md:w-28 md:h-28 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-2xl font-extrabold text-stone-900">
                    {person.name}
                  </h3>
                  <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-sm">
                    {person.relation}
                  </span>
                </div>
                {person.notes && (
                  <p className="text-stone-700 text-base leading-snug pt-1 font-medium">
                    {person.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-stone-100 flex-wrap">
              <button
                onClick={() => handleSpeakPerson(person)}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-sm sm:text-base transition-colors cursor-pointer"
              >
                <Volume2 className="w-5 h-5 text-amber-700" />
                <span>Hear Voice</span>
              </button>

              {/* Download Photo Button */}
              <button
                id={`download-photo-btn-${person.id}`}
                onClick={(e) => handleDownload(person, e)}
                disabled={downloadingId === person.id}
                className="min-h-[48px] px-3.5 py-2.5 flex items-center justify-center gap-1.5 rounded-2xl bg-amber-50 hover:bg-amber-200/70 text-amber-900 border-2 border-amber-300 font-black text-xs sm:text-sm transition-colors cursor-pointer"
                title="Download photograph to your device"
              >
                {downloadSuccessId === person.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className={`w-4 h-4 text-amber-700 ${downloadingId === person.id ? 'animate-bounce' : ''}`} />
                    <span>{downloadingId === person.id ? 'Saving...' : 'Photo'}</span>
                  </>
                )}
              </button>

              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  title="Call family member"
                >
                  <Phone className="w-5 h-5 text-emerald-700" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Full-Size Photo Modal */}
      {selectedPhotoPerson && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhotoPerson(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-amber-300 space-y-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="text-xl font-black text-stone-900">{selectedPhotoPerson.name}</h3>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {selectedPhotoPerson.relation}
                </span>
              </div>
              <button
                onClick={() => setSelectedPhotoPerson(null)}
                className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-stone-900 border-2 border-amber-200 flex items-center justify-center max-h-[60vh]">
              <img
                src={selectedPhotoPerson.photo_url}
                alt={selectedPhotoPerson.name}
                className="w-full h-full max-h-[60vh] object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleSpeakPerson(selectedPhotoPerson)}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-5 h-5 text-amber-700" />
                <span>Listen to Voice</span>
              </button>
              
              <button
                id="modal-download-photo-btn"
                onClick={() => handleDownload(selectedPhotoPerson)}
                disabled={downloadingId === selectedPhotoPerson.id}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {downloadSuccessId === selectedPhotoPerson.id ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-950" />
                    <span>Photo Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-stone-950" />
                    <span>{downloadingId === selectedPhotoPerson.id ? 'Downloading...' : 'Download Photo'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassuring note */}
      <div className="text-center p-4 rounded-2xl bg-amber-50 border border-amber-200 text-stone-700 font-medium">
        <p className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          You are deeply loved, and your family is always here by your side.
        </p>
      </div>
    </div>
  );
};
