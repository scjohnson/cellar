import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWines, getWineRankings, getRecentComparisons } from '../lib/queries'
import type { Wine, Comparison } from '../lib/queries'
import { Wine as WineIcon, Activity, Trophy, GitCompare, Layers, HelpCircle } from 'lucide-react'

const ELO_BASELINE = 1500

interface CellarDashboardProps {
  onSelectWine: (id: string) => void
}

export default function CellarDashboard({ onSelectWine }: CellarDashboardProps) {
  const [rankingPerson, setRankingPerson] = useState<'stephen' | 'jennifer'>('stephen')

  const { data: wines = [], isLoading: loadingWines } = useQuery<Wine[]>({
    queryKey: ['wines-dashboard'],
    queryFn: () => getWines(false),
  })

  const { data: rankings = [], isLoading: loadingRankings } = useQuery<Wine[]>({
    queryKey: ['rankings', rankingPerson],
    queryFn: () => getWineRankings(rankingPerson),
  })

  const { data: comparisons = [], isLoading: loadingComparisons } = useQuery<Comparison[]>({
    queryKey: ['recent-comparisons'],
    queryFn: () => getRecentComparisons(30),
  })

  // Cellar stats (inventory only)
  const stats = useMemo(() => {
    const inCellar = wines.filter(w => w.quantity > 0)
    const totalBottles = inCellar.reduce((acc, curr) => acc + curr.quantity, 0)
    const uniqueWines = inCellar.length

    // Style breakdown
    const styles: Record<string, number> = {}
    inCellar.forEach(w => {
      const s = w.style.toLowerCase()
      styles[s] = (styles[s] || 0) + w.quantity
    })

    return { totalBottles, uniqueWines, styles }
  }, [wines])

  // Ranked wines that have moved off baseline (participated in at least 1 comparison)
  const rankedWines = useMemo(() => {
    const eloCol = rankingPerson === 'stephen' ? 'stephen_elo' : 'jennifer_elo'
    return rankings.filter(w => w[eloCol] !== ELO_BASELINE)
  }, [rankings, rankingPerson])

  // Top 10 wines for display (ranked or all sorted by elo)
  const top10 = useMemo(() => rankings.slice(0, 10), [rankings])

  const isLoading = loadingWines || loadingRankings || loadingComparisons

  // Helper: describe comparison result for a person
  const describeResult = (c: Comparison, person: 'stephen' | 'jennifer') => {
    const winnerId = person === 'stephen' ? c.stephen_winner : c.jennifer_winner
    if (winnerId === null) return null  // not expressed
    if (winnerId === c.wine_a_id) return c.wine_a?.producer
    if (winnerId === c.wine_b_id) return c.wine_b?.producer
    return 'Tie'
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#0c0a09] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-rose-900 border-t-rose-400 rounded-full animate-spin"></div>
        <p className="text-stone-400 text-xs font-medium">Loading cellar stats...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0c0a09] overflow-y-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0c0a09]/95 backdrop-blur-md border-b border-stone-850 px-4 py-4">
        <h2 className="text-stone-100 font-bold text-lg">Cellar Dashboard</h2>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#131110] border border-stone-850 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>Total Bottles</span>
            </span>
            <span className="text-rose-400 text-3xl font-black mt-2 font-mono">
              {stats.totalBottles}
            </span>
          </div>

          <div className="bg-[#131110] border border-stone-850 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
              <WineIcon className="h-3 w-3" />
              <span>Unique Cuvées</span>
            </span>
            <span className="text-stone-100 text-3xl font-black mt-2 font-mono">
              {stats.uniqueWines}
            </span>
          </div>
        </div>

        {/* Style Distribution */}
        <div className="bg-[#131110]/50 border border-stone-850 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-850/60 pb-2">
            <Activity className="h-3.5 w-3.5 text-stone-500" />
            <span>Style Distribution</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.styles).map(([style, count]) => {
              const percentage = stats.totalBottles > 0 ? (count / stats.totalBottles) * 100 : 0
              let barColor = 'bg-stone-500'
              if (style === 'red') barColor = 'bg-rose-700'
              else if (style === 'white') barColor = 'bg-amber-300'
              else if (style === 'rose') barColor = 'bg-pink-400'
              else if (style === 'sparkling') barColor = 'bg-yellow-400'
              else if (style === 'orange') barColor = 'bg-orange-500'
              else if (style === 'dessert') barColor = 'bg-purple-500'
              else if (style === 'fortified') barColor = 'bg-red-700'

              return (
                <div key={style} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold capitalize text-stone-300">
                    <span>{style}</span>
                    <span className="font-mono text-stone-400">{count} btl ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })}
            {Object.keys(stats.styles).length === 0 && (
              <p className="text-stone-600 text-xs italic text-center py-3">No bottles in cellar.</p>
            )}
          </div>
        </div>

        {/* === ELO RANKINGS === */}
        <div className="bg-[#131110]/50 border border-stone-850 rounded-xl overflow-hidden">
          {/* Rankings Header + Person Toggle */}
          <div className="px-4 py-3 border-b border-stone-850/60 flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>Elo Rankings</span>
            </h3>
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setRankingPerson('stephen')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  rankingPerson === 'stephen'
                    ? 'bg-rose-900 text-rose-100 border border-rose-800'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                Stephen
              </button>
              <button
                onClick={() => setRankingPerson('jennifer')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  rankingPerson === 'jennifer'
                    ? 'bg-purple-900 text-purple-100 border border-purple-800'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                Jennifer
              </button>
            </div>
          </div>

          {/* Rankings list */}
          <div className="divide-y divide-stone-850/40">
            {rankedWines.length === 0 ? (
              <div className="px-4 py-8 text-center space-y-2">
                <GitCompare className="h-7 w-7 text-stone-700 mx-auto" />
                <p className="text-stone-500 text-xs font-semibold">No comparisons logged yet</p>
                <p className="text-stone-600 text-[10px] max-w-xs mx-auto leading-relaxed">
                  Tell Claude which wine you preferred after your next tasting. Rankings will appear here as comparisons are logged.
                </p>
              </div>
            ) : (
              top10.map((wine, idx) => {
                const elo = rankingPerson === 'stephen' ? wine.stephen_elo : wine.jennifer_elo
                const isBaseline = elo === ELO_BASELINE
                const eloDisplay = elo.toFixed(0)
                const rankColor =
                  idx === 0 ? 'text-amber-400' :
                  idx === 1 ? 'text-stone-300' :
                  idx === 2 ? 'text-amber-700' :
                  'text-stone-500'

                return (
                  <div
                    key={wine.id}
                    onClick={() => onSelectWine(wine.id)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-stone-900/40 cursor-pointer transition-colors active:scale-[0.99] duration-100"
                  >
                    {/* Rank number */}
                    <span className={`text-sm font-black w-5 text-right shrink-0 ${rankColor}`}>
                      {idx + 1}
                    </span>

                    {/* Wine info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-200 text-xs font-bold truncate">
                        {wine.producer}
                        {wine.name && <span className="text-stone-400 font-normal"> · {wine.name}</span>}
                      </p>
                      <p className="text-stone-500 text-[10px] mt-0.5">
                        {wine.vintage || 'NV'} · <span className="capitalize">{wine.style}</span>
                        {wine.region && ` · ${wine.region}`}
                      </p>
                    </div>

                    {/* Elo badge */}
                    <div className="shrink-0 text-right">
                      <span className={`text-sm font-black font-mono ${isBaseline ? 'text-stone-600' : rankingPerson === 'stephen' ? 'text-rose-400' : 'text-purple-400'}`}>
                        {eloDisplay}
                      </span>
                      {isBaseline && (
                        <p className="text-[9px] text-stone-600 mt-0.5">unranked</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* === RECENT COMPARISONS === */}
        {comparisons.length > 0 && (
          <div className="bg-[#131110]/50 border border-stone-850 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-850/60">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <GitCompare className="h-3.5 w-3.5 text-stone-500" />
                <span>Recent Comparisons</span>
              </h3>
            </div>
            <div className="divide-y divide-stone-850/40">
              {comparisons.slice(0, 5).map((c) => {
                const stephenResult = describeResult(c, 'stephen')
                const jenniferResult = describeResult(c, 'jennifer')

                return (
                  <div key={c.id} className="px-4 py-3 space-y-2">
                    {/* Date */}
                    <span className="text-[10px] text-stone-500 font-medium">
                      {new Date(c.comparison_date).toLocaleDateString()}
                      {c.occasion && ` · ${c.occasion}`}
                    </span>

                    {/* The matchup */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-300 font-semibold truncate">
                        {c.wine_a?.producer}
                        {c.wine_a?.vintage && ` '${String(c.wine_a.vintage).slice(2)}`}
                      </span>
                      <span className="text-stone-600 shrink-0">vs</span>
                      <span className="text-stone-300 font-semibold truncate">
                        {c.wine_b?.producer}
                        {c.wine_b?.vintage && ` '${String(c.wine_b.vintage).slice(2)}`}
                      </span>
                    </div>

                    {/* Results */}
                    <div className="flex gap-3 text-[10px]">
                      {stephenResult && (
                        <span className="text-stone-400">
                          <span className="text-rose-400 font-bold">S:</span>{' '}
                          {stephenResult}
                        </span>
                      )}
                      {jenniferResult && (
                        <span className="text-stone-400">
                          <span className="text-purple-400 font-bold">J:</span>{' '}
                          {jenniferResult}
                        </span>
                      )}
                    </div>

                    {c.notes && (
                      <p className="text-[10px] text-stone-500 italic leading-relaxed">{c.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="bg-stone-900/10 border border-dashed border-stone-850 rounded-xl p-4 text-center">
          <HelpCircle className="h-5 w-5 text-stone-600 mx-auto mb-1.5" />
          <p className="text-[11px] text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Rankings update automatically as you log comparisons through the Claude Project. All wines start at Elo 1500.
          </p>
        </div>
      </div>
    </div>
  )
}
