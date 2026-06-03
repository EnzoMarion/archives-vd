import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
    Trophy, ChevronLeft, Sword,
    Zap, Crown, BarChart3, Shield, ChevronRight, Plus, Trash2, Lock, Medal, Award, Bot, Pickaxe
} from 'lucide-react';

// --- CONFIG FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDweheuX3dU3SJb8_Yo3NH7bbBgZcujPg8",
    authDomain: "archives-vd-loghorizon.firebaseapp.com",
    projectId: "archives-vd-loghorizon",
    storageBucket: "archives-vd-loghorizon.firebasestorage.app",
    messagingSenderId: "157250892985",
    appId: "1:157250892985:web:394e7862e87ed11ddf9768",
    measurementId: "G-ETXYZR4FP9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "archives-vd-loghorizon";

// --- CONSTS / UTILS ---
const CURRENT_SEASON = 's4';
const LEGACY_SEASON = 's3';

const SEASON_THEMES = {
    s3: {
        id: 's3',
        short: 'S3',
        name: 'Saison 3',
        fullName: 'Saison 3 — Archéologues & Dinosaures',
        description: 'Les archives fossiles de la guilde, entre reliques et scores préhistoriques.',
        icon: Pickaxe,
        guildColor: '#f59e0b',
        primaryText: 'text-amber-400',
        secondaryText: 'text-emerald-400',
        softBg: 'bg-amber-500/10',
        softBorder: 'border-amber-500/30',
        strongBorder: 'border-amber-500',
        buttonClass: 'bg-amber-500 hover:bg-amber-400 text-black',
        secondaryButtonClass: 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20',
        titleGradient: 'from-amber-400 via-yellow-300 to-emerald-400',
        panelGradient: 'from-amber-500/12 via-emerald-500/6 to-transparent',
        chipClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
        emptyLabel: 'Aucune VD archéologique enregistrée.',
    },
    s4: {
        id: 's4',
        short: 'S4',
        name: 'Saison 4',
        fullName: 'Saison 4 — Robots & Ingénieurs',
        description: 'Une nouvelle ère mécanique pour les archives de la guilde.',
        icon: Bot,
        guildColor: '#22d3ee',
        primaryText: 'text-cyan-400',
        secondaryText: 'text-fuchsia-400',
        softBg: 'bg-cyan-500/10',
        softBorder: 'border-cyan-500/30',
        strongBorder: 'border-cyan-500',
        buttonClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
        secondaryButtonClass: 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20',
        titleGradient: 'from-cyan-400 via-sky-300 to-fuchsia-400',
        panelGradient: 'from-cyan-500/12 via-fuchsia-500/6 to-transparent',
        chipClass: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
        emptyLabel: 'Aucune VD robotique enregistrée pour le moment.',
    }
};

const MEMBER_COLORS = [
    '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
    '#a855f7', '#d946ef', '#fbbf24', '#2dd4bf', '#fb7185',
    '#818cf8', '#34d399', '#60a5fa', '#f472b6', '#fb923c'
];

const getSeasonConfig = (seasonId) => SEASON_THEMES[seasonId] || SEASON_THEMES[LEGACY_SEASON];
const getSessionSeason = (session = {}) => session.season || LEGACY_SEASON;

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const extractSessionSortKey = (session = {}) => {
    if (session?.endDate) return session.endDate;
    const match = session?.id?.match(/(\d{4})_(\d{2})_(\d{2})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return '0000-00-00';
};

const sortSessionsAsc = (a, b) => extractSessionSortKey(a).localeCompare(extractSessionSortKey(b));
const sortSessionsDesc = (a, b) => extractSessionSortKey(b).localeCompare(extractSessionSortKey(a));

const normalizeName = (str = '') =>
    str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const SOLO_PATTERNS = [
    (a) => `${a} a réveillé un dinosaure de la saison 3.`,
    (a) => `${a} a laissé des traces fossiles dans les archives.`,
    (a) => `${a} a calibré les robots de la saison 4.`,
    (a) => `${a} ne bug jamais. Enfin presque.`,
    (a) => `${a} transforme chaque VD en rapport d’ingénierie.`,
    (a) => `${a} mérite un labo secret rien qu’à lui.`,
];

const DUO_PATTERNS = [
    (a, b) => `${a} et ${b} sont un duo illégal en VD.`,
    (a, b) => `${a} construit, ${b} termine le chantier.`,
    (a, b) => `${a} déterre les points, ${b} les empile.`,
    (a, b) => `${a} et ${b} ont probablement un plan secret.`,
    (a, b) => `Quand ${a} et ${b} jouent, les robots applaudissent.`,
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const buildGlobalStats = (sessionsObj, seasonFilter = 'all') => {
    const sessions = Object.values(sessionsObj)
        .filter((s) => seasonFilter === 'all' || getSessionSeason(s) === seasonFilter)
        .sort(sortSessionsAsc);

    const memberTotals = {};

    sessions.forEach((s) => {
        s.members.forEach((m) => {
            if (m.value === undefined || m.value === null) return;
            if (normalizeName(m.name) === 'autre') return;

            const key = normalizeName(m.name);
            if (!memberTotals[key]) {
                memberTotals[key] = {
                    key,
                    name: m.name,
                    totalPct: 0,
                    totalPoints: 0,
                    history: []
                };
            }

            memberTotals[key].totalPct += m.value;
            memberTotals[key].totalPoints += (m.points || 0);
            memberTotals[key].history.push({
                sessionId: s.id,
                season: getSessionSeason(s),
                seasonLabel: getSeasonConfig(getSessionSeason(s)).fullName,
                label: s.shortLabel || s.label,
                value: m.value,
                points: m.points || 0,
                totalPointsLog: s.totalPointsLog,
                endDate: extractSessionSortKey(s),
            });
        });
    });

    const hallOfFame = Object.values(memberTotals).sort((a, b) => b.totalPct - a.totalPct);

    const records = [];
    sessions.forEach((s) => {
        s.members.forEach((m) => {
            if (m.value === undefined || m.value === null) return;
            if (normalizeName(m.name) === 'autre') return;
            records.push({
                name: m.name,
                value: m.value,
                points: m.points || 0,
                sessionId: s.id,
                season: getSessionSeason(s),
                label: s.shortLabel || s.label,
            });
        });
    });
    records.sort((a, b) => b.value - a.value);

    return {
        memberTotals,
        hallOfFame,
        records,
        sessions,
    };
};

// --- UI ---
const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
        {children}
    </div>
);

const SeasonBadge = ({ seasonId, className = "" }) => {
    const theme = getSeasonConfig(seasonId);
    const Icon = theme.icon;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${theme.chipClass} ${className}`}>
            <Icon className="w-3 h-3" />
            {theme.short}
        </span>
    );
};

const SeasonTabs = ({ value, onChange, counts }) => {
    const options = [
        { id: 'all', label: 'Toutes', count: counts.all },
        { id: 's4', label: 'S4', count: counts.s4 },
        { id: 's3', label: 'S3', count: counts.s3 },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {options.map((opt) => {
                const isActive = value === opt.id;
                const theme = opt.id === 'all' ? getSeasonConfig(CURRENT_SEASON) : getSeasonConfig(opt.id);

                return (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={`px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                            isActive
                                ? `${theme.buttonClass} border-transparent shadow-lg`
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                    >
                        {opt.label} <span className="opacity-70">({opt.count})</span>
                    </button>
                );
            })}
        </div>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-950/95 border-2 border-cyan-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50">
                <p className="text-white font-black uppercase italic tracking-wider text-xs mb-1 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    {data.name || payload[0].name}
                </p>
                <div className="h-px bg-slate-800 my-2 w-full"></div>
                <p className="text-cyan-400 font-mono text-sm font-bold">
                    {payload[0].value?.toLocaleString ? payload[0].value.toLocaleString() : payload[0].value} {payload[0].unit || 'pts'}
                </p>
            </div>
        );
    }
    return null;
};

const Podium = ({ members, totalPoints, seasonId }) => {
    const top3 = useMemo(() => members?.slice(0, 3) || [], [members]);
    const theme = getSeasonConfig(seasonId);

    if (top3.length < 3) return null;

    const formatPts = (m) => m.points ? m.points.toLocaleString() : Math.round((totalPoints * m.value) / 100).toLocaleString();

    return (
        <div className="space-y-4 md:space-y-0 md:flex md:items-end md:justify-center md:gap-4 max-w-4xl mx-auto py-8 px-4">
            <div className="order-2 md:order-1 flex flex-col items-center gap-2 md:w-1/3">
                <div className="text-slate-400 font-black italic text-[10px] uppercase tracking-widest text-center">2nd PLACE</div>
                <div className="w-full bg-slate-400/5 border-t-4 border-slate-400 p-4 rounded-2xl md:rounded-b-none text-center shadow-xl border border-slate-800">
                    <Medal className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                    <p className="text-white font-black uppercase italic truncate">{top3[1].name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{formatPts(top3[1])} pts</p>
                </div>
            </div>

            <div className="order-1 md:order-2 flex flex-col items-center gap-2 md:w-1/3 scale-105 z-10">
                <Crown className={`w-8 h-8 ${theme.primaryText} animate-bounce`} />
                <div className={`w-full ${theme.softBg} border-t-4 ${theme.strongBorder} p-6 rounded-2xl md:rounded-b-none md:rounded-t-3xl text-center shadow-2xl border border-slate-800`}>
                    <p className="text-xl md:text-2xl font-black text-white uppercase italic truncate">{top3[0].name}</p>
                    <p className={`${theme.primaryText} font-mono text-sm font-bold`}>{formatPts(top3[0])} pts</p>
                    <div className={`${theme.buttonClass} text-[9px] font-black py-1 px-3 rounded-full uppercase tracking-widest inline-block mx-auto mt-2`}>
                        Champion
                    </div>
                </div>
            </div>

            <div className="order-3 md:order-3 flex flex-col items-center gap-2 md:w-1/3">
                <div className="text-orange-600 font-black italic text-[10px] uppercase tracking-widest text-center">3rd PLACE</div>
                <div className="w-full bg-orange-600/5 border-t-4 border-orange-600 p-4 rounded-2xl md:rounded-b-none text-center shadow-xl border border-slate-800">
                    <Award className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                    <p className="text-white font-black uppercase italic truncate">{top3[2].name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{formatPts(top3[2])} pts</p>
                </div>
            </div>
        </div>
    );
};

// --- Recherche joueur ---
const PlayerSearch = ({ allMembers, onSelectPlayer, hasStats }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const handleChange = (value) => {
        setInput(value);
        if (!value || !hasStats || !allMembers.length) {
            setSuggestions([]);
            return;
        }
        const norm = normalizeName(value);
        const filtered = allMembers
            .filter((m) => normalizeName(m).startsWith(norm))
            .slice(0, 8);
        setSuggestions(filtered);
    };

    const handleSelect = (name) => {
        setInput(name);
        setSuggestions([]);
        onSelectPlayer(name);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input) return;
        handleSelect(input);
    };

    return (
        <form className="relative" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder={hasStats ? "Rechercher un membre..." : "Chargement..."}
                value={input}
                onChange={(e) => handleChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-200 outline-none focus:border-cyan-500 min-w-[200px]"
                disabled={!hasStats}
            />
            {suggestions.length > 0 && (
                <div className="absolute right-0 mt-1 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((name) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => handleSelect(name)}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
        </form>
    );
};

// --- PAGES ---
const HomePage = ({
                      sessions,
                      selectedSeason,
                      onSeasonChange,
                      onSelectSession,
                      onOpenAdmin,
                      onOpenHall,
                      randomMessage
                  }) => {
    const activeTheme = getSeasonConfig(selectedSeason === 'all' ? CURRENT_SEASON : selectedSeason);

    const sessionList = Object.values(sessions)
        .filter((session) => selectedSeason === 'all' || getSessionSeason(session) === selectedSeason)
        .sort(sortSessionsDesc);

    const counts = {
        all: Object.values(sessions).length,
        s3: Object.values(sessions).filter((s) => getSessionSeason(s) === 's3').length,
        s4: Object.values(sessions).filter((s) => getSessionSeason(s) === 's4').length,
    };

    return (
        <div className="space-y-8 md:space-y-12 py-6 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
            <Card className={`relative overflow-hidden p-6 md:p-8 lg:p-10 bg-gradient-to-br ${activeTheme.panelGradient}`}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-5 max-w-4xl min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <SeasonBadge seasonId={CURRENT_SEASON} />
                            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                                Log Horizon
                            </span>
                        </div>

                        <div className="space-y-4 min-w-0">
                            <h1
                                className="font-black uppercase italic tracking-[-0.06em] leading-[0.9] text-white break-words"
                                style={{ fontSize: 'clamp(2.8rem, 9vw, 6.8rem)' }}
                            >
                                ARCHIVES <span className={`bg-gradient-to-r ${activeTheme.titleGradient} bg-clip-text text-transparent`}>VD</span>
                            </h1>

                            <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
                                {selectedSeason === 'all'
                                    ? 'Les saisons de guerre de la guilde, réunies dans une seule archive.'
                                    : activeTheme.description}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                onClick={onOpenHall}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest ${activeTheme.buttonClass}`}
                            >
                                <Crown className="w-4 h-4" /> Hall of Fame
                            </button>

                            <button
                                onClick={onOpenAdmin}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest ${activeTheme.secondaryButtonClass}`}
                            >
                                <Lock className="w-4 h-4" /> Administration
                            </button>
                        </div>

                        {randomMessage && (
                            <p className="text-slate-500 text-sm italic max-w-2xl pt-2">
                                {randomMessage}
                            </p>
                        )}
                    </div>

                    <div className="w-full lg:max-w-sm">
                        <Card className="p-5 bg-slate-950/55 border-slate-800 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] uppercase tracking-[0.35em] font-black text-slate-500">
                                    Saison active
                                </p>
                                <SeasonBadge seasonId={CURRENT_SEASON} />
                            </div>

                            <div className="space-y-2">
                                <p className="text-white font-black uppercase italic text-lg">
                                    {getSeasonConfig(CURRENT_SEASON).fullName}
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {CURRENT_SEASON === 's4'
                                        ? 'Nouvelle esthétique, nouvelles archives, même domination.'
                                        : 'Les anciennes campagnes restent gravées dans les archives.'}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </Card>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.35em] font-black text-slate-500">
                        Filtrer les archives
                    </p>
                    <h2 className="text-xl md:text-2xl font-black italic uppercase text-white">
                        {selectedSeason === 'all' ? 'Toutes les saisons' : activeTheme.fullName}
                    </h2>
                </div>
                <SeasonTabs value={selectedSeason} onChange={onSeasonChange} counts={counts} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {sessionList.map((session) => {
                    const sessionSeason = getSessionSeason(session);
                    const theme = getSeasonConfig(sessionSeason);
                    const Icon = theme.icon;

                    return (
                        <button
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            className="group relative bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-cyan-500 transition-all text-left shadow-2xl overflow-hidden active:scale-95"
                        >
                            <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 group-hover:text-cyan-500/10 transition-colors rotate-12" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <SeasonBadge seasonId={sessionSeason} />
                                    <Icon className={`w-5 h-5 ${theme.primaryText}`} />
                                </div>

                                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-cyan-400 uppercase italic truncate">
                                    {session.shortLabel}
                                </h3>

                                <div className="space-y-1">
                                    <p className="text-slate-400 font-bold text-[11px]">{session.label}</p>
                                    <p className="text-slate-600 font-mono text-[10px] uppercase">
                                        Fin : {formatDisplayDate(extractSessionSortKey(session))}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme.primaryText}`}>
                                        {session.guilds[0]?.name || 'LogHorizon'}
                                    </span>
                                    <ChevronRight className={`w-5 h-5 ${theme.primaryText} group-hover:translate-x-1 transition-transform`} />
                                </div>
                            </div>
                        </button>
                    );
                })}

                {sessionList.length === 0 && (
                    <div className="col-span-full">
                        <Card className={`p-10 text-center ${activeTheme.softBg} ${activeTheme.softBorder}`}>
                            <div className="space-y-3">
                                <div className="flex justify-center">
                                    <SeasonBadge seasonId={selectedSeason === 'all' ? CURRENT_SEASON : selectedSeason} />
                                </div>
                                <p className="text-white font-black uppercase italic tracking-widest">
                                    {selectedSeason === 'all' ? 'Aucune session enregistrée' : activeTheme.emptyLabel}
                                </p>
                                <p className="text-slate-500 text-sm">
                                    Commence par importer une nouvelle VD depuis l’administration.
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminPage = ({ onImport, sessions, onDelete, onBack, currentSeason }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState("");
    const [csvData, setCsvData] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [totalPoints, setTotalPoints] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [vdCountForAnalysis, setVdCountForAnalysis] = useState(5);
    const [seasonId, setSeasonId] = useState(currentSeason);

    const activeTheme = getSeasonConfig(seasonId);

    const contributionAnalysis = useMemo(() => {
        const values = Object.values(sessions)
            .filter((s) => getSessionSeason(s) === seasonId)
            .sort(sortSessionsDesc);

        if (!values.length) return null;

        const slice = values.slice(0, vdCountForAnalysis);
        const acc = {};

        slice.forEach((s) => {
            s.members.forEach((m) => {
                if (m.value === undefined || m.value === null) return;
                if (normalizeName(m.name) === 'autre') return;
                const key = normalizeName(m.name);
                if (!acc[key]) {
                    acc[key] = { key, name: m.name, sumPct: 0, count: 0 };
                }
                acc[key].sumPct += m.value;
                acc[key].count += 1;
            });
        });

        const alwaysHere = Object.values(acc).filter((m) => m.count === slice.length);
        if (!alwaysHere.length) return null;

        const withAvg = alwaysHere.map((m) => ({
            ...m,
            avgPct: m.sumPct / m.count,
        }));

        const bottom5 = withAvg
            .sort((a, b) => a.avgPct - b.avgPct)
            .slice(0, 5);

        return {
            totalSessions: slice.length,
            playersCount: withAvg.length,
            bottom5,
        };
    }, [sessions, vdCountForAnalysis, seasonId]);

    const adminCode = import.meta.env.VITE_ADMIN_CODE || "coucu";

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Card className="p-8 w-full max-w-sm text-center space-y-6">
                    <Shield className="w-12 h-12 mx-auto text-cyan-500" />
                    <h2 className="text-xl font-black text-white uppercase italic tracking-widest">ACCÈS SÉCURISÉ</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            adminCode === passcode ? setIsAuthenticated(true) : setError("Invalide");
                        }}
                        className="space-y-4"
                    >
                        <input
                            type="password"
                            placeholder="Code secret"
                            value={passcode}
                            onChange={e => setPasscode(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-center text-white outline-none focus:border-cyan-500 font-black tracking-widest"
                        />
                        {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}
                        <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase py-4 rounded-xl">
                            Entrer
                        </button>
                        <button type="button" onClick={onBack} className="text-slate-600 text-[10px] font-black uppercase">
                            Retour
                        </button>
                    </form>
                </Card>
            </div>
        );
    }

    const filteredSessions = Object.values(sessions)
        .filter((s) => getSessionSeason(s) === seasonId)
        .sort(sortSessionsDesc);

    return (
        <div className="py-12 max-w-4xl mx-auto px-4 space-y-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 uppercase font-black text-[10px] hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" /> Annuler
            </button>

            <Card className={`p-6 md:p-8 space-y-6 shadow-2xl bg-gradient-to-br ${activeTheme.panelGradient}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <SeasonBadge seasonId={seasonId} />
                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-slate-500">
                                Import saisonnier
                            </p>
                        </div>
                        <h2 className="text-3xl font-black text-white italic uppercase">PANNEAU DE GESTION CLOUD</h2>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="uppercase font-black">Dernières VD analysées</span>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={vdCountForAnalysis}
                            onChange={(e) => setVdCountForAnalysis(Number(e.target.value) || 1)}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-cyan-500 text-right"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Saison</label>
                        <select
                            value={seasonId}
                            onChange={(e) => setSeasonId(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none text-sm focus:border-cyan-500"
                        >
                            <option value="s4">Saison 4 — Robots & Ingénieurs</option>
                            <option value="s3">Saison 3 — Archéologues & Dinosaures</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Date de début</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none text-sm focus:border-cyan-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Date de fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none text-sm focus:border-cyan-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Points guilde</label>
                        <input
                            type="number"
                            placeholder="Points Totaux LogHorizon (auto si guild dans CSV)"
                            value={totalPoints}
                            onChange={e => setTotalPoints(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none text-sm"
                        />
                    </div>
                </div>

                <textarea
                    rows="6"
                    value={csvData}
                    onChange={e => setCsvData(e.target.value)}
                    placeholder={"guild,LogHorizon,1822608\nmember,Buer,150432"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-cyan-500"
                ></textarea>

                {error && (
                    <p className="text-red-500 text-xs font-bold uppercase">{error}</p>
                )}

                {success && (
                    <p className="text-emerald-400 text-xs font-bold uppercase">{success}</p>
                )}

                <button
                    onClick={async () => {
                        setError("");
                        setSuccess("");

                        if (!startDate || !endDate || !csvData.trim()) {
                            setError("Date de début, date de fin et CSV requis.");
                            return;
                        }

                        const guilds = [];
                        const membersRaw = [];

                        csvData.split('\n').forEach((l) => {
                            const p = l.split(',').map(s => s.trim());
                            if (p.length < 3) return;

                            if (p[0] === 'guild') {
                                guilds.push({ name: p[1], points: parseInt(p[2], 10), color: '#3b82f6' });
                            } else if (p[0] === 'member') {
                                const name = p[1];
                                const points = parseInt(p[2], 10);
                                if (normalizeName(name) === 'autre') return;
                                membersRaw.push({ name, points });
                            }
                        });

                        const totalGuildPoints =
                            guilds.find(g => normalizeName(g.name) === 'loghorizon')?.points ||
                            parseInt(totalPoints, 10) ||
                            0;

                        if (!totalGuildPoints) {
                            setError("Impossible de déterminer les points de guilde.");
                            return;
                        }

                        const members = membersRaw
                            .map(m => ({
                                name: m.name,
                                points: m.points,
                                value: parseFloat(((m.points / totalGuildPoints) * 100).toFixed(2)),
                            }))
                            .sort((a, b) => b.points - a.points);

                        const dStart = formatDisplayDate(startDate);
                        const dEnd = formatDisplayDate(endDate);
                        const theme = getSeasonConfig(seasonId);

                        const normalizedGuilds = (guilds.length ? guilds : [{
                            name: 'LogHorizon',
                            points: totalGuildPoints,
                            color: theme.guildColor
                        }]).map((g, index) => ({
                            ...g,
                            color: normalizeName(g.name) === 'loghorizon'
                                ? theme.guildColor
                                : (g.color || (index === 0 ? theme.guildColor : '#64748b'))
                        }));

                        const payload = {
                            id: `${seasonId}_session_${endDate.split('-').join('_')}`,
                            season: seasonId,
                            seasonLabel: theme.fullName,
                            startDate,
                            endDate,
                            label: `${dStart} au ${dEnd}`,
                            shortLabel: `VD ${dEnd}`,
                            totalPointsLog: totalGuildPoints,
                            guilds: normalizedGuilds,
                            members,
                        };

                        await onImport(payload);
                        setSuccess(`Session ${theme.short} publiée.`);
                        setCsvData("");
                        setTotalPoints("");
                    }}
                    className={`w-full ${activeTheme.buttonClass} font-black uppercase py-4 rounded-xl shadow-lg flex items-center justify-center gap-2`}
                >
                    <Plus className="w-5 h-5" /> Publier sur la base
                </button>
            </Card>

            {contributionAnalysis && (
                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">
                            Plus faibles contributeurs
                        </h3>
                        <span className="text-[10px] text-slate-400 uppercase font-black">
                            Sur {contributionAnalysis.totalSessions} dernières VD
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">
                        Présents sur toutes ces VD : {contributionAnalysis.playersCount} joueurs
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest font-mono">
                            <tr>
                                <th className="px-4 py-2">Membre</th>
                                <th className="px-4 py-2 text-right">Moyenne %</th>
                                <th className="px-4 py-2 text-right">Présence</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                            {contributionAnalysis.bottom5.map((m) => (
                                <tr key={m.key}>
                                    <td className="px-4 py-2 text-white font-bold uppercase italic">
                                        {m.name}
                                    </td>
                                    <td className="px-4 py-2 text-right text-cyan-400 font-mono">
                                        {m.avgPct.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-500 font-mono text-[11px]">
                                        {m.count} / {contributionAnalysis.totalSessions} VD
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <div className="space-y-3">
                {filteredSessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                        <div className="space-y-1">
                            <p className="text-white font-bold text-xs">{s.label}</p>
                            <div className="flex items-center gap-2">
                                <SeasonBadge seasonId={getSessionSeason(s)} />
                                <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
                                    {extractSessionSortKey(s)}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => onDelete(s.id)} className="text-slate-600 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatsPage = ({ sessionId, sessions, onBack, onSelectPlayer }) => {
    const data = sessions[sessionId];
    if (!data) return null;

    const seasonId = getSessionSeason(data);
    const theme = getSeasonConfig(seasonId);
    const totalLog = data.guilds.find(g => normalizeName(g.name) === 'loghorizon')?.points || data.totalPointsLog || 0;

    return (
        <div className="space-y-8 py-8 px-4 animate-in fade-in">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest"
            >
                <ChevronLeft className="w-5 h-5" /> Retour
            </button>

            <div className={`border-l-4 ${theme.strongBorder} pl-4 space-y-2`}>
                <div className="flex flex-wrap items-center gap-3">
                    <SeasonBadge seasonId={seasonId} />
                    <p className={`text-[10px] uppercase font-black tracking-[0.35em] ${theme.primaryText}`}>
                        Rapport de guerre
                    </p>
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{data.label}</h2>
                <p className="text-slate-500 text-sm">{theme.fullName}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <Card className={`p-4 bg-gradient-to-br ${theme.panelGradient}`}>
                    <p className="text-slate-500 text-[8px] uppercase font-black">Score guilde</p>
                    <p className="text-xl md:text-3xl font-black text-white italic tracking-tighter">{totalLog.toLocaleString()}</p>
                </Card>

                <Card className={`p-4 ${theme.softBg}`}>
                    <p className="text-slate-500 text-[8px] uppercase font-black">MVP</p>
                    <p className="text-xl md:text-3xl font-black text-white uppercase italic truncate tracking-tighter">{data.members[0]?.name}</p>
                </Card>

                <Card className="p-4 bg-sky-500/10">
                    <p className="text-slate-500 text-[8px] uppercase font-black">Membres</p>
                    <p className="text-xl md:text-3xl font-black text-white italic">{data.members.length}</p>
                </Card>

                <Card className="p-4 bg-fuchsia-500/10">
                    <p className="text-slate-500 text-[8px] uppercase font-black">Saison</p>
                    <p className={`text-xl md:text-3xl font-black italic ${theme.primaryText}`}>{theme.short}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6 md:p-8">
                    <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-2">
                        <BarChart3 className={`w-5 h-5 ${theme.primaryText}`} /> Puissance guildes
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.guilds} layout="vertical" margin={{ left: -10 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} width={90} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="points" radius={[0, 4, 4, 0]} barSize={25}>
                                    {data.guilds.map((e, i) => (
                                        <Cell key={`c-${i}`} fill={e.color || theme.guildColor} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 md:p-8">
                    <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-2">
                        <Zap className={`w-5 h-5 ${theme.primaryText}`} /> Parts membres
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.members}
                                    dataKey="value"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius="80%"
                                    innerRadius="60%"
                                    paddingAngle={2}
                                    label={({ name, percent }) => (percent > 0.08 ? name : '')}
                                >
                                    {data.members.map((_, i) => (
                                        <Cell
                                            key={`p-${i}`}
                                            fill={MEMBER_COLORS[i % MEMBER_COLORS.length]}
                                            stroke="#020203"
                                            strokeWidth={2}
                                            className="hover:scale-105 transition-transform"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip unit="%" />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Podium members={data.members} totalPoints={data.totalPointsLog} seasonId={seasonId} />

            <Card className="overflow-x-auto shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest font-mono">
                    <tr>
                        <th className="px-6 py-4">Rang</th>
                        <th className="px-6 py-4">Membre</th>
                        <th className="px-8 py-4 text-right">Part (%)</th>
                        <th className="px-8 py-4 text-right">Points Réels</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                    {data.members.map((m, i) => (
                        <tr key={m.name} className="hover:bg-cyan-600/5 transition-colors group">
                            <td className="px-6 py-4">
                                <span
                                    className={`w-7 h-7 rounded flex items-center justify-center font-black ${
                                        i < 3 ? `${theme.buttonClass}` : 'bg-slate-800 text-slate-500'
                                    }`}
                                >
                                    {i + 1}
                                </span>
                            </td>
                            <td
                                className="px-6 py-4 text-white font-black uppercase italic group-hover:text-cyan-400 cursor-pointer"
                                onClick={() => onSelectPlayer && onSelectPlayer(m.name)}
                            >
                                {m.name}
                            </td>
                            <td className="px-8 py-4 text-right text-cyan-400 font-mono font-black">
                                {m.value}%
                            </td>
                            <td className="px-8 py-4 text-right text-slate-500 font-mono italic">
                                {(m.points || Math.round((data.totalPointsLog * m.value) / 100)).toLocaleString()}{' '}
                                <span className="text-[8px] opacity-40 uppercase ml-1">Pts</span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

const HallOfFamePage = ({ globalStats, onBack, onSelectPlayer, selectedSeason }) => {
    const { hallOfFame, records } = globalStats;
    const top10 = hallOfFame.slice(0, 10);
    const absoluteRecord = records[0];
    const theme = getSeasonConfig(selectedSeason === 'all' ? CURRENT_SEASON : selectedSeason);

    return (
        <div className="space-y-8 py-8 px-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest"
            >
                <ChevronLeft className="w-5 h-5" /> Retour
            </button>

            <div className={`border-l-4 ${theme.strongBorder} pl-4`}>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    {selectedSeason !== 'all' && <SeasonBadge seasonId={selectedSeason} />}
                    <p className={`text-[10px] uppercase font-black tracking-[0.35em] ${theme.primaryText}`}>
                        Légendes de Log Horizon
                    </p>
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    Hall of Fame
                </h2>
                <p className="text-slate-400 text-sm">
                    {selectedSeason === 'all' ? 'Classement cumulé toutes saisons' : `Classement cumulé ${theme.fullName}`}
                </p>
            </div>

            {absoluteRecord && (
                <Card className={`p-6 bg-gradient-to-r ${theme.panelGradient} flex items-center justify-between`}>
                    <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            Record absolu
                        </p>
                        <p className="text-2xl md:text-3xl font-black text-white uppercase italic">
                            {absoluteRecord.name}
                        </p>
                        <p className="text-slate-400 text-xs">
                            {absoluteRecord.value}% sur {absoluteRecord.label}
                        </p>
                    </div>
                    <Crown className={`w-10 h-10 ${theme.primaryText}`} />
                </Card>
            )}

            <Card className="overflow-hidden">
                <div className="p-6 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-2">
                        <Trophy className={`w-5 h-5 ${theme.primaryText}`} />
                        Top 10 accumulé
                    </h3>
                    {selectedSeason !== 'all' && <SeasonBadge seasonId={selectedSeason} />}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest font-mono">
                        <tr>
                            <th className="px-6 py-4">Rang</th>
                            <th className="px-6 py-4">Membre</th>
                            <th className="px-8 py-4 text-right">Points Totaux</th>
                            <th className="px-8 py-4 text-right">Sessions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                        {top10.map((m, i) => (
                            <tr key={m.key} className="hover:bg-cyan-600/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <span
                                        className={`w-7 h-7 rounded flex items-center justify-center font-black ${
                                            i < 3 ? `${theme.buttonClass}` : 'bg-slate-800 text-slate-500'
                                        }`}
                                    >
                                        {i + 1}
                                    </span>
                                </td>
                                <td
                                    className="px-6 py-4 text-white font-black uppercase italic group-hover:text-cyan-400 cursor-pointer"
                                    onClick={() => onSelectPlayer && onSelectPlayer(m.name)}
                                >
                                    {m.name}
                                </td>
                                <td className="px-8 py-4 text-right text-cyan-400 font-mono font-black">
                                    {(m.totalPoints || 0).toLocaleString()} pts
                                </td>
                                <td className="px-8 py-4 text-right text-slate-500 font-mono">
                                    {m.history.length}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const PlayerProfilePage = ({ playerName, globalStats, onBack, selectedSeason }) => {
    const key = normalizeName(playerName);
    const player = globalStats.memberTotals[key];
    if (!player) return null;

    const theme = getSeasonConfig(selectedSeason === 'all' ? CURRENT_SEASON : selectedSeason);

    const chartData = player.history.map((h) => ({
        name: h.label,
        percent: h.value,
        points: h.points,
        estimatedPoints: h.points || Math.round((h.totalPointsLog * h.value) / 100),
        season: h.season,
    }));

    const first5 = player.history.slice(-5);
    const trend =
        first5.length >= 2
            ? first5[first5.length - 1].value - first5[0].value
            : 0;

    const totalPoints = player.totalPoints || player.history.reduce(
        (sum, h) => sum + (h.points || Math.round((h.totalPointsLog * h.value) / 100)),
        0
    );

    return (
        <div className="space-y-8 py-8 px-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest"
            >
                <ChevronLeft className="w-5 h-5" /> Retour
            </button>

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className={`border-l-4 ${theme.strongBorder} pl-4`}>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        {selectedSeason !== 'all' && <SeasonBadge seasonId={selectedSeason} />}
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            Profil joueur
                        </p>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        {player.name}
                    </h2>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="px-4 py-3">
                        <p className="text-[8px] uppercase font-black text-slate-500">
                            Sessions suivies
                        </p>
                        <p className="text-lg font-black text-white text-right">
                            {player.history.length}
                        </p>
                    </Card>

                    <Card className="px-4 py-3">
                        <p className="text-[8px] uppercase font-black text-slate-500">
                            % cumulé sur VD
                        </p>
                        <p className="text-lg font-black text-cyan-400 text-right">
                            {player.totalPct.toFixed(1)}%
                        </p>
                    </Card>

                    <Card className="px-4 py-3">
                        <p className="text-[8px] uppercase font-black text-slate-500">
                            Points réels cumulés
                        </p>
                        <p className="text-lg font-black text-fuchsia-400 text-right">
                            {totalPoints.toLocaleString()}
                        </p>
                    </Card>

                    <Card className="px-4 py-3">
                        <p className="text-[8px] uppercase font-black text-slate-500">
                            Tendance 5 dernières
                        </p>
                        <p
                            className={`text-lg font-black text-right ${
                                trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                        >
                            {trend >= 0 ? '+' : ''}
                            {trend.toFixed(1)}%
                        </p>
                    </Card>
                </div>
            </div>

            <Card className="p-6 md:p-8">
                <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2">
                    <BarChart3 className={`w-5 h-5 ${theme.primaryText}`} />
                    Progression sur les sessions
                </h3>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                            <YAxis yAxisId="left" stroke="#22d3ee" fontSize={10} />
                            <YAxis yAxisId="right" orientation="right" stroke="#d946ef" fontSize={10} />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    return (
                                        <div className="bg-slate-950/95 border-2 border-cyan-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50">
                                            <p className="text-white font-black uppercase italic tracking-wider text-xs mb-1">
                                                {label}
                                            </p>
                                            {payload.map((entry) => (
                                                <p
                                                    key={entry.dataKey}
                                                    className="text-xs text-slate-200 font-mono"
                                                >
                                                    {entry.dataKey === 'percent'
                                                        ? `Part de la session : ${entry.value}%`
                                                        : `Part du score guilde : ${entry.value.toLocaleString()} pts`}
                                                </p>
                                            ))}
                                        </div>
                                    );
                                }}
                            />
                            <Legend />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="percent"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                name="% de la session"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="estimatedPoints"
                                stroke="#d946ef"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                name="Part du score guilde"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
                        Historique détaillé
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-widest font-mono">
                        <tr>
                            <th className="px-6 py-3">Session</th>
                            <th className="px-6 py-3">Saison</th>
                            <th className="px-6 py-3 text-right">Part (%)</th>
                            <th className="px-6 py-3 text-right">Points Réels</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                        {player.history.map((h) => (
                            <tr key={h.sessionId} className="hover:bg-cyan-600/5">
                                <td className="px-6 py-3 text-white">{h.label}</td>
                                <td className="px-6 py-3">
                                    <SeasonBadge seasonId={h.season} />
                                </td>
                                <td className="px-6 py-3 text-right text-cyan-400 font-mono">
                                    {h.value}%
                                </td>
                                <td className="px-6 py-3 text-right text-slate-400 font-mono">
                                    {(h.points || Math.round((h.totalPointsLog * h.value) / 100)).toLocaleString()}{' '}
                                    <span className="text-[8px] uppercase opacity-40">Pts</span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// --- APP ---
export default function App() {
    const [view, setView] = useState('home');
    const [previousView, setPreviousView] = useState('home');
    const [selectedId, setSelectedId] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [sessions, setSessions] = useState({});
    const [user, setUser] = useState(null);
    const [randomHomeMessage, setRandomHomeMessage] = useState("");
    const [selectedSeason, setSelectedSeason] = useState(CURRENT_SEASON);

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
        const unsub = onSnapshot(
            collection(db, 'artifacts', appId, 'public', 'data', 'sessions'),
            (snap) => {
                const d = {};
                snap.forEach(doc => { d[doc.id] = doc.data(); });
                setSessions(d);
            },
            (err) => console.error("Firestore error:", err)
        );
        return () => unsub();
    }, [user]);

    useEffect(() => {
        const values = Object.values(sessions)
            .filter((session) => selectedSeason === 'all' || getSessionSeason(session) === selectedSeason)
            .sort(sortSessionsDesc);

        if (!values.length) {
            setRandomHomeMessage("");
            return;
        }

        const latest = values[0];
        const members = latest.members || [];
        if (!members.length) {
            setRandomHomeMessage("");
            return;
        }

        const names = members.map((m) => m.name);
        const shuffled = [...names].sort(() => Math.random() - 0.5);
        const hasAtLeastTwo = shuffled.length >= 2;

        let msg = "";
        if (!hasAtLeastTwo) {
            const a = shuffled[0];
            const pattern = pickRandom(SOLO_PATTERNS);
            msg = pattern(a);
        } else {
            const a = shuffled[0];
            const b = shuffled[1];
            const useDuo = Math.random() < 0.5;
            if (useDuo) {
                const pattern = pickRandom(DUO_PATTERNS);
                msg = pattern(a, b);
            } else {
                const pattern = pickRandom(SOLO_PATTERNS);
                msg = pattern(a);
            }
        }

        setRandomHomeMessage(msg);
    }, [sessions, selectedSeason]);

    const activeStats = useMemo(() => {
        if (!sessions || Object.keys(sessions).length === 0) return null;
        return buildGlobalStats(sessions, selectedSeason);
    }, [sessions, selectedSeason]);

    const allMembersList = useMemo(() => {
        if (!activeStats) return [];
        return Object.values(activeStats.memberTotals).map((m) => m.name);
    }, [activeStats]);

    const handleImport = async (s) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', s.id), s);
            setSelectedSeason(s.season || CURRENT_SEASON);
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

    const openPlayer = (name) => {
        if (!activeStats) return;
        const key = normalizeName(name);
        if (!activeStats.memberTotals[key]) {
            alert("Ce membre n'existe pas encore dans la saison sélectionnée.");
            return;
        }
        setSelectedPlayer(activeStats.memberTotals[key].name);
        setPreviousView(view);
        setView('player');
    };

    return (
        <div className="min-h-screen bg-[#020203] text-slate-200 selection:bg-cyan-500 pb-10 font-sans">
            <nav className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 min-h-16 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setView('home')}
                    >
                        <div className="bg-cyan-500 p-1.5 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.35)] group-hover:rotate-6 transition-transform">
                            <Sword className="w-5 h-5 text-slate-950" />
                        </div>
                        <div>
                            <span className="block font-black text-xl tracking-tighter uppercase italic leading-none text-white">
                                LOG HORIZON
                            </span>
                            <span className="block text-[8px] font-black uppercase tracking-widest text-cyan-400 leading-none mt-1">
                                Archives multisaissons
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 justify-between md:justify-end">
                        <PlayerSearch
                            allMembers={allMembersList}
                            hasStats={!!activeStats}
                            onSelectPlayer={openPlayer}
                        />

                        <div className="flex items-center gap-3">
                            <SeasonBadge seasonId={selectedSeason === 'all' ? CURRENT_SEASON : selectedSeason} />
                            <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                    user
                                        ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                        : 'bg-red-500'
                                }`}
                            ></div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto">
                {view === 'home' && (
                    <HomePage
                        sessions={sessions}
                        selectedSeason={selectedSeason}
                        onSeasonChange={setSelectedSeason}
                        onSelectSession={(id) => {
                            setSelectedId(id);
                            setPreviousView('home');
                            setView('stats');
                        }}
                        onOpenAdmin={() => setView('admin')}
                        onOpenHall={() => {
                            setPreviousView('home');
                            setView('hall');
                        }}
                        randomMessage={randomHomeMessage}
                    />
                )}

                {view === 'stats' && (
                    <StatsPage
                        sessionId={selectedId}
                        sessions={sessions}
                        onBack={() => setView('home')}
                        onSelectPlayer={openPlayer}
                    />
                )}

                {view === 'admin' && (
                    <AdminPage
                        sessions={sessions}
                        onImport={handleImport}
                        onDelete={handleDelete}
                        onBack={() => setView('home')}
                        currentSeason={CURRENT_SEASON}
                    />
                )}

                {view === 'hall' && activeStats && (
                    <HallOfFamePage
                        globalStats={activeStats}
                        onBack={() => setView(previousView || 'home')}
                        onSelectPlayer={openPlayer}
                        selectedSeason={selectedSeason}
                    />
                )}

                {view === 'player' && selectedPlayer && activeStats && (
                    <PlayerProfilePage
                        playerName={selectedPlayer}
                        globalStats={activeStats}
                        onBack={() => setView(previousView || 'home')}
                        selectedSeason={selectedSeason}
                    />
                )}
            </main>
        </div>
    );
}