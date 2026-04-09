import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import {
  Trophy, Users, Calendar, ChevronLeft, Sword,
  Target, Zap, Crown, BarChart3, Clock, Shield, ChevronRight, Plus, Trash2, Lock, Unlock, Medal, Award
} from 'lucide-react';

// --- CONFIGURATION FIREBASE OFFICIELLE (La tienne) ---
const firebaseConfig = {
  apiKey: "AIzaSyDweheuX3dU3SJb8_Yo3NH7bbBgZcujPg8",
  authDomain: "archives-vd-loghorizon.firebaseapp.com",
  projectId: "archives-vd-loghorizon",
  storageBucket: "archives-vd-loghorizon.firebasestorage.app",
  messagingSenderId: "157250892985",
  appId: "1:157250892985:web:394e7862e87ed11ddf9768",
  measurementId: "G-ETXYZR4FP9"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "archives-vd-loghorizon"; // ID Unique de ton projet

// Palette de 20 couleurs vives
const MEMBER_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#a855f7', '#d946ef', '#fbbf24', '#2dd4bf', '#fb7185',
  '#818cf8', '#34d399', '#60a5fa', '#f472b6', '#fb923c'
];

// --- Utilitaires ---
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// --- Composants UI ---
const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
        <div className="bg-slate-950/95 border-2 border-blue-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50">
          <p className="text-white font-black uppercase italic tracking-wider text-xs mb-1 flex items-center gap-2">
            <Zap className="w-3 h-3 text-blue-400" />
            {data.name || payload[0].name}
          </p>
          <div className="h-px bg-slate-800 my-2 w-full"></div>
          <p className="text-cyan-400 font-mono text-sm font-bold">
            {payload[0].value.toLocaleString()} {payload[0].unit || 'pts'}
          </p>
        </div>
    );
  }
  return null;
};

const Podium = ({ members, totalPoints }) => {
  const top3 = useMemo(() => members?.slice(0, 3) || [], [members]);
  if (top3.length < 3) return null;
  const getPoints = (val) => Math.round((totalPoints * val) / 100).toLocaleString();

  return (
      <div className="space-y-4 md:space-y-0 md:flex md:items-end md:justify-center md:gap-4 max-w-4xl mx-auto py-8 px-4">
        <div className="order-2 md:order-1 flex flex-col items-center gap-2 md:w-1/3">
          <div className="text-slate-400 font-black italic text-[10px] uppercase tracking-widest text-center">2nd PLACE</div>
          <div className="w-full bg-slate-400/5 border-t-4 border-slate-400 p-4 rounded-2xl md:rounded-b-none text-center shadow-xl border border-slate-800">
            <Medal className="w-6 h-6 mx-auto text-slate-400 mb-2" />
            <p className="text-white font-black uppercase italic truncate">{top3[1].name}</p>
            <p className="text-slate-500 font-mono text-[10px]">{getPoints(top3[1].value)} pts</p>
          </div>
        </div>
        <div className="order-1 md:order-2 flex flex-col items-center gap-2 md:w-1/3 scale-105 z-10">
          <Crown className="w-8 h-8 text-yellow-500 animate-bounce" />
          <div className="w-full bg-yellow-500/10 border-t-4 border-yellow-500 p-6 rounded-2xl md:rounded-b-none md:rounded-t-3xl text-center shadow-2xl border border-slate-800">
            <p className="text-xl md:text-2xl font-black text-white uppercase italic truncate">{top3[0].name}</p>
            <p className="text-yellow-500 font-mono text-sm font-bold">{getPoints(top3[0].value)} pts</p>
            <div className="bg-yellow-500 text-black text-[9px] font-black py-1 px-3 rounded-full uppercase tracking-widest inline-block mx-auto mt-2">Champion</div>
          </div>
        </div>
        <div className="order-3 md:order-3 flex flex-col items-center gap-2 md:w-1/3">
          <div className="text-orange-600 font-black italic text-[10px] uppercase tracking-widest text-center">3rd PLACE</div>
          <div className="w-full bg-orange-600/5 border-t-4 border-orange-600 p-4 rounded-2xl md:rounded-b-none text-center shadow-xl border border-slate-800">
            <Award className="w-6 h-6 mx-auto text-orange-600 mb-1" />
            <p className="text-white font-black uppercase italic truncate">{top3[2].name}</p>
            <p className="text-slate-500 font-mono text-[10px]">{getPoints(top3[2].value)} pts</p>
          </div>
        </div>
      </div>
  );
};

// --- Pages ---
const HomePage = ({ sessions, onSelectSession, onOpenAdmin }) => (
    <div className="space-y-8 md:space-y-12 py-6 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter italic uppercase">
          Archives <span className="text-blue-600">VD</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
          Données de la guilde synchronisées en temps réel.
        </p>
        <button onClick={onOpenAdmin} className="flex items-center gap-2 mx-auto bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-slate-700">
          <Lock className="w-3.5 h-3.5" /> Administration
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {Object.values(sessions).sort((a,b) => b.id.localeCompare(a.id)).map((session) => (
            <button key={session.id} onClick={() => onSelectSession(session.id)} className="group relative bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-blue-500 transition-all text-left shadow-2xl overflow-hidden active:scale-95">
              <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 group-hover:text-blue-500/10 transition-colors rotate-12" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-blue-400 uppercase italic truncate">{session.shortLabel}</h3>
                <p className="text-slate-500 font-bold text-[10px]">{session.label}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 text-blue-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">{session.guilds[0]?.name}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
        ))}
        {Object.values(sessions).length === 0 && <div className="col-span-full py-20 text-center text-slate-700 uppercase font-black italic tracking-widest">Aucune session en ligne</div>}
      </div>
    </div>
);

const AdminPage = ({ onImport, sessions, onDelete, onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [csvData, setCsvData] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPoints, setTotalPoints] = useState("");
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <Card className="p-8 w-full max-w-sm text-center space-y-6">
            <Shield className="w-12 h-12 mx-auto text-blue-500" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-widest">ACCÈS SÉCURISÉ</h2>
            <form onSubmit={(e) => { e.preventDefault(); passcode === "coucudu26" ? setIsAuthenticated(true) : setError("Invalide"); }} className="space-y-4">
              <input type="password" placeholder="Code secret" value={passcode} onChange={e => setPasscode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-center text-white outline-none focus:border-blue-500 font-black tracking-widest" />
              {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-xl">Entrer</button>
              <button type="button" onClick={onBack} className="text-slate-600 text-[10px] font-black uppercase">Retour</button>
            </form>
          </Card>
        </div>
    );
  }

  return (
      <div className="py-12 max-w-4xl mx-auto px-4 space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 uppercase font-black text-[10px] hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /> Annuler</button>
        <Card className="p-6 md:p-8 space-y-6 shadow-2xl">
          <h2 className="text-3xl font-black text-white italic uppercase">PANNEAU DE GESTION CLOUD</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Date de Début</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none text-sm focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Date de Fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none text-sm focus:border-blue-500" />
            </div>
            <input type="number" placeholder="Points Totaux LogHorizon" value={totalPoints} onChange={e => setTotalPoints(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none text-sm md:col-span-2" />
          </div>
          <textarea rows="6" value={csvData} onChange={e => setCsvData(e.target.value)} placeholder="guild,LogHorizon,628120&#10;member,Buer,11.7" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-blue-500"></textarea>
          <button onClick={() => {
            const guilds = [], members = [];
            csvData.split('\n').forEach(l => {
              const p = l.split(',').map(s => s.trim());
              if(p.length < 3) return;
              if(p[0] === 'guild') guilds.push({name: p[1], points: parseInt(p[2]), color: '#3b82f6'});
              else if(p[0] === 'member') members.push({name: p[1], value: parseFloat(p[2])});
            });
            const dStart = formatDisplayDate(startDate);
            const dEnd = formatDisplayDate(endDate);
            onImport({ id: "session_"+endDate.split('-').join('_'), label: `${dStart} au ${dEnd}`, shortLabel: `VD ${dEnd}`, totalPointsLog: parseInt(totalPoints), guilds, members });
          }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Publier sur la base</button>
        </Card>
        <div className="space-y-2">
          {Object.values(sessions).map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                <p className="text-white font-bold text-xs">{s.label}</p>
                <button onClick={() => onDelete(s.id)} className="text-slate-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
          ))}
        </div>
      </div>
  );
}

const StatsPage = ({ sessionId, sessions, onBack }) => {
  const data = sessions[sessionId];
  if (!data) return null;
  const totalLog = data.guilds.find(g => g.name === 'LogHorizon')?.points || 0;

  return (
      <div className="space-y-8 py-8 px-4 animate-in fade-in">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest"><ChevronLeft className="w-5 h-5" /> Retour</button>
        <div className="border-l-4 border-blue-600 pl-4">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{data.label}</h2>
          <p className="text-blue-500 font-bold text-[10px] uppercase">Rapport de Guerre</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Card className="p-4 bg-gradient-to-br from-blue-600/10 to-transparent">
            <p className="text-slate-500 text-[8px] uppercase font-black">Score Guilde</p>
            <p className="text-xl md:text-3xl font-black text-white italic tracking-tighter">{totalLog.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent">
            <p className="text-slate-500 text-[8px] uppercase font-black">MVP</p>
            <p className="text-xl md:text-3xl font-black text-white uppercase italic truncate tracking-tighter">{data.members[0]?.name}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <p className="text-slate-500 text-[8px] uppercase font-black">Membres</p>
            <p className="text-xl md:text-3xl font-black text-white italic">{data.members.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-500/10 to-transparent text-red-500">
            <p className="text-slate-500 text-[8px] uppercase font-black">Rang</p>
            <p className="text-xl md:text-3xl font-black italic">TOP 1</p>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 md:p-8">
            <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" /> Puissance Guildes</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.guilds} layout="vertical" margin={{ left: -10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="points" radius={[0, 4, 4, 0]} barSize={25}>
                    {data.guilds.map((e, i) => <Cell key={`c-${i}`} fill={e.color || '#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-6 md:p-8">
            <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Parts Membres</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.members} dataKey="value" cx="50%" cy="50%" outerRadius="80%" innerRadius="60%" paddingAngle={2} label={({ name, percent }) => percent > 0.08 ? name : ''}>
                    {data.members.map((_, i) => <Cell key={`p-${i}`} fill={MEMBER_COLORS[i % MEMBER_COLORS.length]} stroke="#020203" strokeWidth={2} className="hover:scale-105 transition-transform" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip unit="%" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Podium members={data.members} totalPoints={data.totalPointsLog} />
        <Card className="overflow-x-auto shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest font-mono">
            <tr><th className="px-6 py-4">Rang</th><th className="px-6 py-4">Membre</th><th className="px-8 py-4 text-right">Part</th><th className="px-8 py-4 text-right">Points Est.</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
            {data.members.map((m, i) => (
                <tr key={m.name} className="hover:bg-blue-600/5 transition-colors group">
                  <td className="px-6 py-4"><span className={`w-7 h-7 rounded flex items-center justify-center font-black ${i < 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{i+1}</span></td>
                  <td className="px-6 py-4 text-white font-black uppercase italic group-hover:text-blue-400">{m.name}</td>
                  <td className="px-8 py-4 text-right text-cyan-400 font-mono font-black">{m.value}%</td>
                  <td className="px-8 py-4 text-right text-slate-500 font-mono italic">{Math.round((data.totalPointsLog * m.value) / 100).toLocaleString()} <span className="text-[8px] opacity-40 uppercase ml-1">Pts</span></td>
                </tr>
            ))}
            </tbody>
          </table>
        </Card>
      </div>
  );
};

export default function App() {
  const [view, setView] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [sessions, setSessions] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), (snap) => {
      const d = {}; snap.forEach(doc => { d[doc.id] = doc.data(); });
      setSessions(d);
    }, (err) => console.error("Firestore error:", err));
    return () => unsub();
  }, [user]);

  const handleImport = async (s) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', s.id), s);
      setView('home');
    } catch (err) {
      console.error("Import error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!user || !window.confirm("Supprimer ?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
      <div className="min-h-screen bg-[#020203] text-slate-200 selection:bg-blue-500 pb-10 font-sans">
        <nav className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
              <div className="bg-blue-600 p-1.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:rotate-6 transition-transform">
                <Sword className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-black text-xl tracking-tighter uppercase italic leading-none text-white leading-none">LOG HORIZON</span>
                <span className="block text-[8px] font-black uppercase tracking-widest text-blue-500 leading-none mt-1">Command Center</span>
              </div>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${user ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto">
          {view === 'home' && <HomePage sessions={sessions} onSelectSession={id => { setSelectedId(id); setView('stats'); }} onOpenAdmin={() => setView('admin')} />}
          {view === 'stats' && <StatsPage sessionId={selectedId} sessions={sessions} onBack={() => setView('home')} />}
          {view === 'admin' && <AdminPage sessions={sessions} onImport={handleImport} onDelete={handleDelete} onBack={() => setView('home')} />}
        </main>
      </div>
  );
}