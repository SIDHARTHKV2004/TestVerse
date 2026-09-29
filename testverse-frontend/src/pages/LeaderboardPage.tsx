import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
// Mock data import removed
import { Trophy, Flame, Award, CheckCircle2, Zap, Target, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const dailyTasks = [
    { id: 'dt-1', title: 'Log 2 Verified Bugs in Banking System', points: 100, completed: true },
    { id: 'dt-2', title: 'Run Playwright Cross-Browser Suite with zero failures', points: 150, completed: false },
    { id: 'dt-3', title: 'Write 5 Manual Test Cases for Payment Gateway', points: 80, completed: true }
  ];

  const weeklyChallenges = [
    { id: 'wc-1', title: 'Automation Sprint Master', desc: 'Submit 3 Selenium Java automation projects in 7 days', reward: '500 Points + "Automation Master" Badge', daysLeft: 2 },
    { id: 'wc-2', title: 'Zero Flaky Tests Challenge', desc: 'Achieve 100% pass rate on 50 consecutive TestNG runs', reward: '350 Points', daysLeft: 4 }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>QA Leaderboard, Streaks & Achievements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compete with peer SDETs, complete daily practice tasks, and climb the QA engineering leaderboard!
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-amber-800 font-bold text-sm shadow-sm">
          <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
          <span>My Active Streak: {user.streakDays || 12} Days</span>
        </div>
      </div>

      {/* Main Layout: 2 Cols Leaderboard, 1 Col Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Top Software Testing Students</span>
              </h3>
              <span className="text-xs text-slate-400">Updated Hourly</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Bugs Logged</th>
                  <th className="p-4">Automation</th>
                  <th className="p-4">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map(entry => (
                  <tr
                    key={entry.user.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      entry.user.id === user.id ? 'bg-blue-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="p-4">
                      {entry.rank === 1 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">🥇 1</span>
                      ) : entry.rank === 2 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center text-xs">🥈 2</span>
                      ) : entry.rank === 3 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center justify-center text-xs">🥉 3</span>
                      ) : (
                        <span className="font-mono text-slate-400 pl-2">#{entry.rank}</span>
                      )}
                    </td>

                    <td className="p-4 flex items-center space-x-3">
                      <img src={entry.user.avatar} alt={entry.user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="font-semibold text-slate-900">{entry.user.name}</div>
                        <div className="text-[10px] text-slate-400">@{entry.user.username}</div>
                      </div>
                    </td>

                    <td className="p-4 font-extrabold text-[#0062E0] text-sm">{entry.points} pts</td>
                    <td className="p-4 text-slate-700">{entry.bugsLogged}</td>
                    <td className="p-4 text-[#00B388] font-semibold">{entry.automationSubmissions} Projects</td>
                    <td className="p-4 font-bold text-amber-600">{entry.streak} 🔥</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Daily & Weekly Challenges */}
        <div className="space-y-6">
          
          {/* Daily Practice Tasks */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Zap className="w-5 h-5 text-[#0062E0]" />
              <h3 className="font-bold text-sm text-slate-900">Daily Practice Tasks</h3>
            </div>

            <div className="space-y-3">
              {dailyTasks.map(dt => (
                <div key={dt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className={`font-semibold ${dt.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{dt.title}</div>
                    <div className="text-[10px] text-[#0062E0] font-bold">+{dt.points} QA Points</div>
                  </div>
                  {dt.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <button className="px-2.5 py-1 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg text-[10px] font-bold shadow-sm transition-all">
                      Start
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Challenges */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Weekly SDET Challenges</h3>
            </div>

            <div className="space-y-3">
              {weeklyChallenges.map(wc => (
                <div key={wc.id} className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{wc.title}</span>
                    <span className="text-[10px] text-slate-400">{wc.daysLeft} days left</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{wc.desc}</p>
                  <div className="text-emerald-700 font-bold text-[11px]">Reward: {wc.reward}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
