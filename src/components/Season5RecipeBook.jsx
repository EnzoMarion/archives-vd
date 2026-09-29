import { useMemo, useState } from 'react';
import { BookOpen, ChefHat, Search, Sparkles } from 'lucide-react';
import {
    INGREDIENT_NAME_FR,
    RECIPE_CATEGORIES,
    RECIPE_EFFECTS,
    RECIPE_NAME_FR,
    SEASON_5_RECIPES,
} from '../data/season5Recipes';

const RARITIES = ['Toutes', 'Common', 'Great', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Immortal'];

const RARITY_STYLES = {
    Common: 'border-slate-700 bg-slate-800/70 text-slate-300',
    Great: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    Rare: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    Epic: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    Legendary: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    Mythic: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    Immortal: 'border-red-300/40 bg-red-300/10 text-red-200',
};

const CATEGORY_LABELS = {
    appetizer: 'Entrée',
    main: 'Plat',
    dessert: 'Dessert',
};

const countIngredients = (ingredients) => Object.entries(
    ingredients.reduce((counts, ingredient) => {
        counts[ingredient] = (counts[ingredient] || 0) + 1;
        return counts;
    }, {})
);

export default function Season5RecipeBook() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [rarity, setRarity] = useState('Toutes');

    const filteredRecipes = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return SEASON_5_RECIPES.filter((recipe) => {
            const matchesCategory = category === 'all' || recipe.category === category;
            const matchesRarity = rarity === 'Toutes' || recipe.rarity === rarity;
            const searchable = [
                recipe.name,
                RECIPE_NAME_FR[recipe.name],
                recipe.rarity,
                ...recipe.ingredients.flatMap((ingredient) => [ingredient, INGREDIENT_NAME_FR[ingredient]]),
            ]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase();
            return matchesCategory && matchesRarity && (!query || searchable.includes(query));
        });
    }, [category, rarity, search]);

    return (
        <section className="overflow-hidden rounded-3xl border border-rose-500/20 bg-slate-900/60 shadow-2xl">
            <div className="border-b border-rose-500/15 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent p-5 md:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-rose-300">
                            <ChefHat className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Saison 5 · Cuisine</span>
                        </div>
                        <h2 className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tight text-white md:text-3xl">
                            <BookOpen className="hidden h-7 w-7 text-rose-300 sm:block" />
                            Carnet des recettes
                        </h2>
                        <p className="text-sm text-slate-400">
                            Les 63 recettes connues, leurs ingrédients et leurs bonus.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-xl">
                        <label className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Recette ou ingrédient…"
                                aria-label="Rechercher une recette ou un ingrédient"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-rose-400 focus:outline-none"
                            />
                        </label>
                        <select
                            value={rarity}
                            onChange={(event) => setRarity(event.target.value)}
                            aria-label="Filtrer par rareté"
                            className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-3 text-sm text-slate-200 focus:border-rose-400 focus:outline-none"
                        >
                            {RARITIES.map((option) => <option key={option} value={option}>{option === 'Toutes' ? 'Toutes raretés' : option}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    {RECIPE_CATEGORIES.map((item) => {
                        const selected = category === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setCategory(item.id)}
                                aria-pressed={selected}
                                className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${selected
                                    ? 'border-rose-400 bg-rose-400 text-slate-950'
                                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-rose-500/40 hover:text-rose-200'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                    <span className="ml-auto text-xs font-mono text-slate-500">
                        {filteredRecipes.length} / {SEASON_5_RECIPES.length}
                    </span>
                </div>
            </div>

            {filteredRecipes.length ? (
                <div className="grid gap-3 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-3">
                    {filteredRecipes.map((recipe) => (
                        <details
                            key={recipe.id}
                            className="group rounded-2xl border border-slate-800 bg-slate-950/50 transition-colors open:border-rose-500/30 open:bg-slate-950/80"
                        >
                            <summary className="flex min-h-20 cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500/10 font-mono text-xs font-bold text-rose-300">
                                    {String(recipe.id).padStart(2, '0')}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold text-white">
                                        {RECIPE_NAME_FR[recipe.name] || recipe.name}
                                    </span>
                                    {RECIPE_NAME_FR[recipe.name] && RECIPE_NAME_FR[recipe.name] !== recipe.name && (
                                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{recipe.name}</span>
                                    )}
                                    <span className="mt-1 block text-[10px] uppercase tracking-wider text-slate-500">
                                        {CATEGORY_LABELS[recipe.category]}
                                    </span>
                                </span>
                                <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${RARITY_STYLES[recipe.rarity]}`}>
                                    {recipe.rarity}
                                </span>
                            </summary>

                            <div className="space-y-4 border-t border-slate-800/80 px-4 pb-4 pt-3">
                                <div>
                                    <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Ingrédients</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {countIngredients(recipe.ingredients).map(([ingredient, count]) => (
                                            <span key={ingredient} className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-300">
                                                {INGREDIENT_NAME_FR[ingredient] || ingredient}{count > 1 ? ` × ${count}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
                                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-rose-100">
                                            {RECIPE_EFFECTS[recipe.effect]} · {recipe.bonus}
                                        </p>
                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Emblèmes héroïques : {recipe.emblems.toLocaleString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            ) : (
                <div className="px-6 py-12 text-center">
                    <p className="font-semibold text-slate-300">Aucune recette ne correspond à ces filtres.</p>
                    <button
                        type="button"
                        onClick={() => { setSearch(''); setCategory('all'); setRarity('Toutes'); }}
                        className="mt-3 text-xs font-bold uppercase tracking-wider text-rose-300 hover:text-rose-200"
                    >
                        Effacer les filtres
                    </button>
                </div>
            )}
        </section>
    );
}
