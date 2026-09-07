import React from 'react';
import { ArrowLeft, Volume2, Phone, Heart, Sparkles } from 'lucide-react';
import { FamiliarPerson, RegionalLanguage } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { speakText } from '../../utils/speechAndAudio';

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

  const handleSpeakPerson = (person: FamiliarPerson) => {
    const textToSpeak = person.voice_prompt || `${person.name}, your beloved ${person.relation}. ${person.notes || ''}`;
    speakText(textToSpeak, language);
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
          onClick={() => speakText('Here are your loving family members and friends. Tap on anyone to hear their voice.', language)}
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
            className="bg-white rounded-3xl p-6 border-4 border-amber-200 shadow-md flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all"
          >
            <div className="flex items-start gap-5">
              <img
                src={person.photo_url}
                alt={person.name}
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-amber-300 shadow-md shrink-0"
              />
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-stone-900">
                  {person.name}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-sm">
                  {person.relation}
                </span>
                {person.notes && (
                  <p className="text-stone-700 text-base leading-snug pt-1 font-medium">
                    {person.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={() => handleSpeakPerson(person)}
                className="flex-1 min-h-[52px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-base transition-colors"
              >
                <Volume2 className="w-5 h-5 text-amber-700" />
                <span>Hear Voice Message</span>
              </button>

              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  title="Call family member"
                >
                  <Phone className="w-6 h-6 text-emerald-700" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

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
