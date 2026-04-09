import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import {
  Trophy, Users, Calendar, ChevronLeft, Sword,
  Target, Zap, Crown, BarChart3, Clock, Shield, ChevronRight, Upload, Plus, Trash2, Settings
} from 'lucide-react';

// --- Données par défaut (Historique initial) ---
const INITIAL_SESSIONS = {
  "session_2026_03_31": {
    id: "session_2026_03_31",
    label: "31/03/2026 au 06/04/2026",
    shortLabel: "Avril 2026 - S1",
    status: "Terminé",
    totalPointsLog: 546940,
    guilds: [
      { name: 'LogHorizon', points: 628120, color: '#3b82f6' },
      { name: 'shadow', points: 581260, color: '#06b6d4' },
      { name: 'Broyeurs', points: 417380, color: '#ef4444' },
      { name: 'Pulsar', points: 173420, color: '#64748b' },
      { name: 'Azuria', points: 92640, color: '#a855f7' },
    ],
    members: [
      { name: 'Buer', value: 11.7 },
      { name: 'Akame26', value: 11.4 },
      { name: 'Nixeur', value: 10.3 },
      { name: 'Angelff28', value: 10.2 },
      { name: 'Kolzah', value: 9.6 },
      { name: 'bloodrc21', value: 8.9 },
      { name: 'LePiéton', value: 8.3 },
      { name: 'APAASH', value: 7.6 },
      { name: 'Lben', value: 6.8 },
      { name: 'Beelze', value: 5.5 },
      { name: 'ZeNox', value: 4.9 },
      { name: '2euxache', value: 4.8 },
      { name: 'commandant', value: 4.6 },
      { name: 'CupCake', value: 4.6 },
      { name: 'Ghyr', value: 2.8 },
      { name: 'LKIcx', value: 1.6 },
      { name: 'Essertio', value: 1.2 },
      { name: 'Autres', value: 0.1 },
    ]
  }
};

// --- Composants de mise en page ---
const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-2xl">
          <p className="text-white font-bold">{payload[0].payload.name || payload[0].name}</p>
          <p className="text-blue-400 font-mono">
            {payload[0].value.toLocaleString()} {payload[0].unit || 'pts'}
          </p>
        </div>
    );
  }
  return null;
};

// --- Page d'accueil (Liste des VD) ---
const HomePage = ({ sessions, onSelectSession, onOpenAdmin }) => (
    <div className="space-y-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
          <Zap className="w-3 h-3 fill-current" /> Système d'Archivage de Guilde
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter italic uppercase">
          Archives <span className="text-blue-600">VD</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Historique des performances de la Vallée des Dragons. Sélectionnez une session terminée pour analyser les résultats tactiques.
        </p>

        <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 mx-auto bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl transition-all font-bold uppercase text-xs tracking-widest border border-slate-700"
        >
          <Settings className="w-4 h-4" /> Administration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {Object.values(sessions).map((session) => (
            <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className="group relative bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-blue-500 transition-all text-left shadow-2xl overflow-hidden active:scale-95"
            >
              <Trophy className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 group-hover:text-blue-500/10 transition-colors rotate-12" />

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-md border border-blue-500/20 uppercase">
                    {session.status}
                  </div>
                  <Clock className="w-5 h-5 text-slate-700 group-hover:text-blue-500 transition-colors" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors uppercase italic">
                    {session.shortLabel}
                  </h3>
                  <p className="text-slate-500 font-bold text-sm tracking-tight">{session.label}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">{session.guilds[0]?.name || "N/A"}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
        ))}
      </div>
    </div>
);

// --- Page Administration (Import CSV) ---
const AdminPage = ({ onImport, sessions, onDelete, onBack }) => {
  const [csvData, setCsvData] = useState("");
  const [newDate, setNewDate] = useState("");
  const [totalPoints, setTotalPoints] = useState("");
  const [error, setError] = useState("");

  const handleImport = () => {
    if (!newDate || !csvData || !totalPoints) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const lines = csvData.split('\n');
      const guilds = [];
      const members = [];

      lines.slice(1).forEach(line => {
        const [type, nom, valeur] = line.split(',');
        if (type === 'guild') {
          guilds.push({ name: nom, points: parseInt(valeur), color: '#3b82f6' });
        } else if (type === 'member') {
          members.push({ name: nom, value: parseFloat(valeur) });
        }
      });

      // Tri automatique
      guilds.sort((a, b) => b.points - a.points);
      members.sort((a, b) => b.value - a.value);

      const id = "session_" + newDate.replace(/\//g, '_');
      const newSession = {
        id,
        label: `VD du ${newDate}`,
        shortLabel: `VD ${newDate}`,
        status: "Importé",
        totalPointsLog: parseInt(totalPoints),
        guilds,
        members
      };

      onImport(newSession);
      setCsvData("");
      setNewDate("");
      setTotalPoints("");
      setError("");
    } catch (e) {
      setError("Erreur de format CSV. Vérifiez vos données.");
    }
  };

  return (
      <div className="py-12 space-y-12 max-w-4xl mx-auto px-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors uppercase font-black text-xs">
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>

        <div className="space-y-6">
          <h2 className="text-4xl font-black text-white italic uppercase italic">Gestion des Données</h2>

          <Card className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Période (ex: 12/05/2026)</label>
                <input
                    type="text"
                    placeholder="00/00/0000"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Points Totaux LogHorizon</label>
                <input
                    type="number"
                    placeholder="546940"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Données CSV (type,nom,valeur)</label>
              <textarea
                  rows="6"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="guild,LogHorizon,628000&#10;guild,Shadow,580000&#10;member,Buer,12.5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-mono text-sm outline-none focus:border-blue-500 transition-colors"
              ></textarea>
            </div>

            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

            <button
                onClick={handleImport}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Ajouter la session
            </button>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase italic">Sessions Enregistrées</h3>
            {Object.values(sessions).map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                  <div>
                    <p className="text-white font-bold">{s.label}</p>
                    <p className="text-slate-500 text-xs uppercase font-black">{s.status}</p>
                  </div>
                  <button
                      onClick={() => onDelete(s.id)}
                      className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}

// --- Page Statistiques (Identique à la précédente) ---
const StatsPage = ({ sessionId, sessions, onBack }) => {
  const data = sessions[sessionId];
  const totalLogHorizon = data.guilds.find(g => g.name === 'LogHorizon')?.points || 0;

  return (
      <div className="space-y-8 py-8 animate-in fade-in duration-500 px-4">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all font-black uppercase text-xs tracking-widest group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Retour
          </button>
          <div className="text-left md:text-right border-l-4 md:border-l-0 md:border-r-4 border-blue-600 pl-4 md:pr-4">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{data.label}</h2>
            <p className="text-blue-500 font-bold text-sm tracking-widest uppercase">Analyse Tactique</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-600/10 to-transparent">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Score Guilde</p>
            <p className="text-4xl font-black text-white italic">{totalLogHorizon.toLocaleString()}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-transparent">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">MVP</p>
            <p className="text-4xl font-black text-white uppercase italic truncate">{data.members[0]?.name || "N/A"}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Effectifs</p>
            <p className="text-4xl font-black text-white italic">{data.members.length}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-transparent">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Classement</p>
            <p className="text-4xl font-black text-white italic">Top 1</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8">
            <h3 className="text-xl font-black text-white uppercase italic mb-8">Puissance des Guildes</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.guilds} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="points" radius={[0, 4, 4, 0]} barSize={35}>
                    {data.guilds.map((entry, index) => <Cell key={`c-${index}`} fill={entry.color || '#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-black text-white uppercase italic mb-8">Répartition Membres</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                      data={data.members}
                      dataKey="value"
                      cx="50%" cy="50%"
                      outerRadius={140} innerRadius={100}
                      paddingAngle={2}
                      label={({ name, percent }) => percent > 0.05 ? name : ''}
                  >
                    {data.members.map((_, index) => (
                        <Cell key={`p-${index}`} fill={index < 5 ? ['#3b82f6', '#06b6d4', '#ef4444', '#f59e0b', '#8b5cf6'][index] : '#1e293b'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip unit="%" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6 border-b border-slate-800"><h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Leaderboard Individuel</h3></div>
          <table className="w-full text-left">
            <thead>
            <tr className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <th className="px-8 py-5">Rang</th>
              <th className="px-8 py-5">Membre</th>
              <th className="px-8 py-5 text-right">Part (%)</th>
              <th className="px-8 py-5 text-right">Points Est.</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
            {data.members.map((m, i) => (
                <tr key={m.name} className="hover:bg-blue-600/5">
                  <td className="px-8 py-4"><span className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center font-black">{i+1}</span></td>
                  <td className="px-8 py-4 text-white font-bold uppercase">{m.name}</td>
                  <td className="px-8 py-4 text-right text-cyan-400 font-mono font-bold">{m.value}%</td>
                  <td className="px-8 py-4 text-right text-slate-500 font-mono italic">{Math.round((data.totalPointsLog * m.value) / 100).toLocaleString()}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </Card>
      </div>
  );
};

// --- Main Application ---
export default function App() {
  const [view, setView] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('vd_archives_data');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  useEffect(() => {
    localStorage.setItem('vd_archives_data', JSON.stringify(sessions));
  }, [sessions]);

  const handleImport = (newSession) => {
    setSessions(prev => ({ ...prev, [newSession.id]: newSession }));
    setView('home');
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer cette session ?")) {
      const newSessions = { ...sessions };
      delete newSessions[id];
      setSessions(newSessions);
    }
  };

  return (
      <div className="min-h-screen bg-[#020203] text-slate-200">
        <nav className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
              <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]"><Sword className="w-6 h-6 text-white" /></div>
              <div>
                <span className="block font-black text-2xl tracking-tighter uppercase italic leading-none text-white">LOG HORIZON</span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-blue-500 leading-none mt-1">Command Center</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto">
          {view === 'home' && <HomePage sessions={sessions} onSelectSession={(id) => { setSelectedId(id); setView('stats'); }} onOpenAdmin={() => setView('admin')} />}
          {view === 'stats' && <StatsPage sessionId={selectedId} sessions={sessions} onBack={() => setView('home')} />}
          {view === 'admin' && <AdminPage sessions={sessions} onImport={handleImport} onDelete={handleDelete} onBack={() => setView('home')} />}
        </main>
      </div>
  );
}