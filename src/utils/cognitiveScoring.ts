import { 
  GameSession, 
  GameType, 
  PatientGamingAnalysis, 
  TrendData, 
  CognitiveDomainScore, 
  DifficultyLevel 
} from '../types';

export const DOMAIN_CONFIG: Record<GameType, { domain: string; title: string; desc: string }> = {
  memory_match: {
    domain: 'Visual Association & Paired Recall',
    title: 'Memory Match (Smriti Milan)',
    desc: 'Short-term visual recall and associative pairing of regional motifs.'
  },
  picture_recognition: {
    domain: 'Semantic & Cultural Recognition',
    title: 'Picture Recognition (Chobi Chena)',
    desc: 'Long-term semantic memory and recognition of familiar Northeast artifacts.'
  },
  sequence_recall: {
    domain: 'Working Memory & Temporal Sequencing',
    title: 'Sequence Recall (Krom Smaran)',
    desc: 'Active working memory span and audio-visual sequential retention.'
  },
  simple_puzzle: {
    domain: 'Spatial Reasoning & Coordination',
    title: 'Simple Cultural Puzzle',
    desc: 'Visuospatial coordination, spatial reconstruction, and motor planning.'
  },
  face_match: {
    domain: 'Facial & Loved Ones Familiarity',
    title: 'Familiar Face Match',
    desc: 'Emotional orientation and visual identification of primary caregivers & family.'
  },
  simple_calculation: {
    domain: 'Numerical Cognition & Working Memory',
    title: 'Simple Math & Calculation',
    desc: 'Numerical working memory, arithmetic fluency, and mental calculation agility.'
  }
};

export const ETHICAL_DISCLAIMER = "This is a cognitive engagement tool, not a medical diagnosis. Consult a healthcare professional for clinical assessment.";

/**
 * Computes deep cognitive performance analysis directly from real gameplay sessions.
 */
export function computeClientSideGamingAnalysis(userSessions: GameSession[]): PatientGamingAnalysis {
  if (!userSessions || userSessions.length === 0) {
    return {
      has_data: false,
      total_games_played: 0,
      gaming_score: 0,
      score_breakdown: {
        accuracy_pts: 0,
        speed_pts: 0,
        focus_pts: 0,
        completion_pts: 0
      },
      average_accuracy_pct: 0,
      average_response_time_sec: 0,
      total_mistakes: 0,
      total_stars: 0,
      domain_breakdown: (Object.keys(DOMAIN_CONFIG) as GameType[]).map(gType => ({
        domain: DOMAIN_CONFIG[gType].domain,
        game_type: gType,
        game_title: DOMAIN_CONFIG[gType].title,
        accuracy: 0,
        avg_response_time: 0,
        sessions_count: 0,
        mistakes_avg: 0,
        status: 'needs_practice' as const,
        analysis: `No gameplay recorded yet for ${DOMAIN_CONFIG[gType].title}. Awaiting patient activity.`
      })),
      trend_direction: 'insufficient_data',
      trend_summary: 'No game sessions logged yet. Cognitive scoring will generate automatically once the patient completes their first game.',
      speed_analysis: 'Reaction time tracking awaiting initial game session.',
      clinical_insight: 'Baseline assessment pending initial patient engagement. No synthetic score is assumed.',
      recommended_game: {
        game_type: 'memory_match',
        title: 'Memory Match (Smriti Milan)',
        reason: 'Recommended starting activity: culturally familiar imagery with soothing voice prompts.'
      },
      recent_sessions_summary: []
    };
  }

  const sortedSessions = [...userSessions].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  const totalGames = sortedSessions.length;
  const totalAccuracy = sortedSessions.reduce((acc, s) => acc + (s.accuracy || 0), 0);
  const avgAccuracy = Math.round(totalAccuracy / totalGames);

  const totalResponseTime = sortedSessions.reduce((acc, s) => acc + (s.response_time || 0), 0);
  const avgResponseTime = Number((totalResponseTime / totalGames).toFixed(1));

  const totalMistakes = sortedSessions.reduce((acc, s) => acc + (s.mistakes || 0), 0);
  const avgMistakes = Number((totalMistakes / totalGames).toFixed(1));

  const totalStars = sortedSessions.reduce((acc, s) => acc + (s.stars || 0), 0);
  const avgCompletion = Math.round(
    sortedSessions.reduce((acc, s) => acc + (s.completion_rate || 100), 0) / totalGames
  );

  // Score Components (out of 100 pts total directly derived from actual gameplay):
  // 1. Accuracy Component (50 pts max)
  const accuracyPts = Math.min(50, Math.max(5, Math.round(avgAccuracy * 0.5)));

  // 2. Speed Agility Component (25 pts max)
  const speedEfficiency = Math.max(20, Math.min(100, Math.round(100 - Math.max(0, avgResponseTime - 2.8) * 11)));
  const speedPts = Math.min(25, Math.max(5, Math.round(speedEfficiency * 0.25)));

  // 3. Focus & Error Control Component (15 pts max)
  const focusEfficiency = Math.max(20, Math.min(100, Math.round(100 - avgMistakes * 25)));
  const focusPts = Math.min(15, Math.max(3, Math.round(focusEfficiency * 0.15)));

  // 4. Completion & Consistency Component (10 pts max)
  const completionPts = Math.min(10, Math.max(2, Math.round(avgCompletion * 0.10)));

  const gamingScore = Math.min(100, Math.max(10, accuracyPts + speedPts + focusPts + completionPts));

  // Domain Breakdown
  const domainBreakdown: CognitiveDomainScore[] = (Object.keys(DOMAIN_CONFIG) as GameType[]).map(gType => {
    const sessions = sortedSessions.filter(s => s.game_type === gType);
    const count = sessions.length;
    if (count === 0) {
      return {
        domain: DOMAIN_CONFIG[gType].domain,
        game_type: gType,
        game_title: DOMAIN_CONFIG[gType].title,
        accuracy: 0,
        avg_response_time: 0,
        sessions_count: 0,
        mistakes_avg: 0,
        status: 'needs_practice' as const,
        analysis: `No gameplay recorded yet for ${DOMAIN_CONFIG[gType].title}. Recommended to establish domain baseline.`
      };
    }

    const domainAcc = Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / count);
    const domainSpeed = Number((sessions.reduce((acc, s) => acc + s.response_time, 0) / count).toFixed(1));
    const domainMistakes = Number((sessions.reduce((acc, s) => acc + s.mistakes, 0) / count).toFixed(1));

    let status: 'strong' | 'steady' | 'needs_practice' = 'steady';
    if (domainAcc >= 88 && domainSpeed <= 5.5) status = 'strong';
    else if (domainAcc < 70 || domainMistakes >= 2.5) status = 'needs_practice';

    let analysisText = '';
    if (status === 'strong') {
      analysisText = `Robust cognitive performance (${domainAcc}% accuracy, ${domainSpeed}s avg reaction). High neural clarity in this domain.`;
    } else if (status === 'steady') {
      analysisText = `Stable retention (${domainAcc}% accuracy, ${domainSpeed}s reaction). Consistent engagement with minimal hesitation.`;
    } else {
      analysisText = `Moderate fatigue or hesitation observed (${domainAcc}% accuracy, ${domainMistakes} avg mistakes). Shorter, encouraging sessions recommended.`;
    }

    return {
      domain: DOMAIN_CONFIG[gType].domain,
      game_type: gType,
      game_title: DOMAIN_CONFIG[gType].title,
      accuracy: domainAcc,
      avg_response_time: domainSpeed,
      sessions_count: count,
      mistakes_avg: domainMistakes,
      status,
      analysis: analysisText
    };
  });

  // Trend Trajectory
  let trendDirection: 'improving' | 'stable' | 'attention_needed' = 'stable';
  let trendSummary = '';
  if (sortedSessions.length >= 3) {
    const half = Math.floor(sortedSessions.length / 2);
    const older = sortedSessions.slice(0, half);
    const newer = sortedSessions.slice(half);

    const olderAvg = older.reduce((a, b) => a + b.accuracy, 0) / older.length;
    const newerAvg = newer.reduce((a, b) => a + b.accuracy, 0) / newer.length;
    const diff = Math.round(newerAvg - olderAvg);

    if (diff >= 3) {
      trendDirection = 'improving';
      trendSummary = `Positive trajectory: Cognitive accuracy increased +${diff}% between earlier and recent sessions. Consistent recall speed across activities.`;
    } else if (diff <= -5) {
      trendDirection = 'attention_needed';
      trendSummary = `Gentle deceleration: Accuracy dipped by ${Math.abs(diff)}% recently. Suggested shorter play intervals and familiar family photos.`;
    } else {
      trendDirection = 'stable';
      trendSummary = `Steady baseline: Cognitive scores maintain consistency within ±${Math.abs(diff)}% across all played activities.`;
    }
  } else {
    trendSummary = `Initial baseline active across ${sortedSessions.length} session(s). Continue daily sessions to establish rolling trajectory.`;
  }

  // Speed Analysis
  let speedAnalysis = '';
  if (avgResponseTime <= 4.2) {
    speedAnalysis = `Swift cognitive processing: Average reaction time of ${avgResponseTime}s demonstrates confident recognition without hesitation.`;
  } else if (avgResponseTime <= 6.5) {
    speedAnalysis = `Balanced and deliberate pace: Average reaction time of ${avgResponseTime}s shows thoughtful inspection of game elements.`;
  } else {
    speedAnalysis = `Relaxed, extended contemplation: Average response time of ${avgResponseTime}s. Patient benefits from open-ended pacing without time pressure.`;
  }

  // Clinical Insight
  const playedDomains = domainBreakdown.filter(d => d.sessions_count > 0);
  const bestDomain = [...playedDomains].sort((a, b) => b.accuracy - a.accuracy)[0];
  const lowestDomain = [...playedDomains].sort((a, b) => a.accuracy - b.accuracy)[0];

  let clinicalInsight = '';
  if (bestDomain) {
    clinicalInsight = `Patient exhibits peak strength in ${bestDomain.domain} (${bestDomain.accuracy}% accuracy across ${bestDomain.sessions_count} games). `;
    if (lowestDomain && lowestDomain.game_type !== bestDomain.game_type) {
      clinicalInsight += `Practicing ${lowestDomain.domain} (${lowestDomain.accuracy}%) will support comprehensive neuro-stimulation.`;
    }
  } else {
    clinicalInsight = `Consistent participation recorded across ${totalGames} game sessions. Overall patient gaming score is ${gamingScore}/100.`;
  }

  // Recommended next game
  let nextGame: GameType = 'memory_match';
  let nextReason = '';
  const zeroSessions = domainBreakdown.filter(d => d.sessions_count === 0);
  if (zeroSessions.length > 0) {
    nextGame = zeroSessions[0].game_type;
    nextReason = `Explore ${zeroSessions[0].game_title} to test ${zeroSessions[0].domain}.`;
  } else if (lowestDomain && lowestDomain.accuracy < 75) {
    nextGame = lowestDomain.game_type;
    nextReason = `Reinforce ${lowestDomain.domain} with gentle supportive gameplay.`;
  } else if (bestDomain) {
    nextGame = bestDomain.game_type;
    nextReason = `Maintain high confidence through familiar strengths in ${bestDomain.game_title}.`;
  }

  // Recent scorecards
  const recentSessionsSummary = [...sortedSessions]
    .reverse()
    .slice(0, 15)
    .map(s => {
      let note = 'Great focus';
      if (s.accuracy >= 90 && s.response_time <= 4.5) note = 'Sharp Recall & Swift Reflexes';
      else if (s.accuracy >= 85) note = 'Accurate Visual Recognition';
      else if (s.mistakes >= 2) note = 'Paced Deliberation';
      else note = 'Comfortable Exploration';

      return {
        id: s.id,
        game_type: s.game_type,
        game_title: DOMAIN_CONFIG[s.game_type]?.title || s.game_type,
        date: new Date(s.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        accuracy: s.accuracy,
        response_time: s.response_time,
        mistakes: s.mistakes,
        stars: s.stars,
        difficulty_level: s.difficulty_level || 'easy',
        note
      };
    });

  return {
    has_data: true,
    total_games_played: totalGames,
    gaming_score: gamingScore,
    score_breakdown: {
      accuracy_pts: accuracyPts,
      speed_pts: speedPts,
      focus_pts: focusPts,
      completion_pts: completionPts
    },
    average_accuracy_pct: avgAccuracy,
    average_response_time_sec: avgResponseTime,
    total_mistakes: totalMistakes,
    total_stars: totalStars,
    domain_breakdown: domainBreakdown,
    trend_direction: trendDirection,
    trend_summary: trendSummary,
    speed_analysis: speedAnalysis,
    clinical_insight: clinicalInsight,
    recommended_game: {
      game_type: nextGame,
      title: DOMAIN_CONFIG[nextGame]?.title || nextGame,
      reason: nextReason
    },
    recent_sessions_summary: recentSessionsSummary
  };
}

/**
 * Transforms an array of GameSession objects into TrendData consumed by CaregiverDashboard.
 */
export function computeClientSideTrends(userSessions: GameSession[]): TrendData {
  const analysis = computeClientSideGamingAnalysis(userSessions);

  const sorted = [...userSessions].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  const trends = sorted.map((s, idx) => ({
    session_num: idx + 1,
    date: new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: s.accuracy,
    response_time: s.response_time,
    mistakes: s.mistakes,
    game_type: s.game_type,
    difficulty: s.difficulty_level || 'easy',
    baseline: analysis.has_data ? analysis.average_accuracy_pct : 0
  }));

  const gameBreakdown: Record<string, number> = {};
  userSessions.forEach(s => {
    gameBreakdown[s.game_type] = (gameBreakdown[s.game_type] || 0) + 1;
  });

  const baselineAccuracy = analysis.average_accuracy_pct;
  const recentAccuracy = sorted.length > 0 ? sorted[sorted.length - 1].accuracy : 0;
  const deviation = baselineAccuracy > 0 ? Math.round(recentAccuracy - baselineAccuracy) : 0;

  return {
    trends,
    baseline_accuracy: baselineAccuracy,
    recent_accuracy: recentAccuracy,
    deviation_from_baseline_pct: deviation,
    baseline_observation: analysis.has_data 
      ? analysis.trend_summary 
      : 'No gameplay sessions recorded yet. Trends will generate automatically.',
    game_breakdown: gameBreakdown,
    ethical_disclaimer: ETHICAL_DISCLAIMER,
    analysis
  };
}
