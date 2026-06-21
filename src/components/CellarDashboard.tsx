import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getWines, getWineRankings, getRecentTastings } from '../lib/queries'
import type { Wine, Tasting } from '../lib/queries'
import { Wine as WineIcon, Trophy, Layers, DollarSign, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const ELO_BASELINE = 1500

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-warm-border rounded-lg p-3 shadow-md text-xs font-sans">
        <p className="font-bold text-burgundy font-serif mb-1">{data.year}</p>
        <p className="text-charcoal font-semibold">
          Bottles Ready: <span className="font-bold text-burgundy">{data.Bottles}</span>
        </p>
        <p className="text-warm-muted text-[10px] mt-0.5">
          Unique Cuvées: {data.Cuvées}
        </p>
      </div>
    )
  }
  return null
}

export default function CellarDashboard() {
  const [rankingPerson, setRankingPerson] = useState<'stephen' | 'jennifer'>('stephen')
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))

  // Fetch wines (in cellar + out)
  const { data: wines = [], isLoading: loadingWines } = useQuery<Wine[]>({
    queryKey: ['wines-dashboard'],
    queryFn: () => getWines(false),
  })

  // Fetch rankings for Elo
  const { data: rankings = [], isLoading: loadingRankings } = useQuery<Wine[]>({
    queryKey: ['rankings', rankingPerson],
    queryFn: () => getWineRankings(rankingPerson),
  })

  // Fetch recent tastings for activity
  const { data: tastings = [], isLoading: loadingTastings } = useQuery<Tasting[]>({
    queryKey: ['recent-tastings-dashboard'],
    queryFn: () => getRecentTastings(4),
  })

  // Process data for KPIs and Charts
  const dashboardStats = useMemo(() => {
    const inCellar = wines.filter(w => w.quantity > 0)
    const totalBottles = inCellar.reduce((acc, curr) => acc + curr.quantity, 0)
    const uniqueWines = inCellar.length

    // Cellar Value
    const totalValue = inCellar.reduce((acc, curr) => acc + (curr.purchase_price || 0) * curr.quantity, 0)
    const bottlesWithPrice = inCellar.filter(w => w.purchase_price !== null).reduce((acc, curr) => acc + curr.quantity, 0)
    const pctPriced = totalBottles > 0 ? Math.round((bottlesWithPrice / totalBottles) * 100) : 0

    // Style distribution for Pie Chart
    const styleCounts: Record<string, number> = {}
    inCellar.forEach(w => {
      const s = w.style.charAt(0).toUpperCase() + w.style.slice(1).toLowerCase()
      styleCounts[s] = (styleCounts[s] || 0) + w.quantity
    })
    
    const styleData = Object.entries(styleCounts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value)

    // Regions distribution for Bar Chart
    const regionCounts: Record<string, number> = {}
    inCellar.forEach(w => {
      const r = w.region || 'Unknown Region'
      regionCounts[r] = (regionCounts[r] || 0) + w.quantity
    })

    const regionData = Object.entries(regionCounts)
      .map(([region, bottles]) => ({ region, bottles }))
      .sort((a, b) => b.bottles - a.bottles)
      .slice(0, 5) // Top 5 regions

    // Longevity Timeline (10 years)
    const currentYear = new Date().getFullYear()
    const timelineYears = Array.from({ length: 10 }, (_, i) => currentYear + i)
    const timelineData = timelineYears.map(year => {
      let bottles = 0
      let cuvees = 0

      inCellar.forEach(w => {
        const from = w.drink_from
        const until = w.drink_until
        if (from || until) {
          const isReady = (!from || year >= from) && (!until || year <= until)
          if (isReady) {
            bottles += w.quantity
            cuvees += 1
          }
        }
      })

      return {
        year: String(year),
        Bottles: bottles,
        Cuvées: cuvees
      }
    })

    return { totalBottles, uniqueWines, totalValue, pctPriced, styleData, regionData, timelineData }
  }, [wines])

  // Get Top 3 Elo ranked wines (who have actually participated in comparisons)
  const topRankedWines = useMemo(() => {
    const eloCol = rankingPerson === 'stephen' ? 'stephen_elo' : 'jennifer_elo'
    return rankings
      .filter(w => w[eloCol] !== ELO_BASELINE)
      .slice(0, 3)
  }, [rankings, rankingPerson])

  // Get wines ready to drink in the selected year
  const winesForSelectedYear = useMemo(() => {
    const yearNum = Number(selectedYear)
    return wines.filter(w => {
      if (w.quantity <= 0) return false
      const from = w.drink_from
      const until = w.drink_until
      if (!from && !until) return false
      return (!from || yearNum >= from) && (!until || yearNum <= until)
    })
  }, [wines, selectedYear])

  const isLoading = loadingWines || loadingRankings || loadingTastings

  // Donut chart color palette mapping
  const styleColors: Record<string, string> = {
    Red: '#4A0E17',       // Deep Burgundy
    White: '#C5A059',     // Metallic Gold
    Rose: '#EAA89B',      // Blush Rosé
    Sparkling: '#D8C3A5', // Pale Gold Champagne
    Orange: '#D97706',    // Amber Orange
    Dessert: '#8B5CF6',   // Sweet Purple
    Fortified: '#B91C1C'  // Ruby Fortified
  }

  const defaultColor = '#6E6A64'

  if (isLoading) {
    return (
      <div className="flex-1 bg-cream flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-burgundy border-t-gold rounded-full animate-spin"></div>
        <p className="text-warm-muted text-xs font-semibold uppercase tracking-wider font-sans">
          Curating Cellar Statistics...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-cream pb-8 px-4 md:px-8 max-w-5xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="py-6 md:py-8 border-b border-warm-border mb-6">
        <h2 className="text-burgundy font-serif font-black text-2xl md:text-3xl tracking-tight">
          Cellar Dashboard
        </h2>
        <p className="text-warm-muted text-xs md:text-sm mt-1">
          A high-level view of your current collection, tasting activity, and Elo rankings.
        </p>
      </div>

      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Bottles */}
          <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-burgundy-light rounded-lg text-burgundy shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-warm-muted uppercase tracking-widest block font-sans">
                Total Bottles
              </span>
              <span className="text-2xl font-bold font-serif text-charcoal mt-1 block">
                {dashboardStats.totalBottles}
              </span>
            </div>
          </div>

          {/* Unique Cuvées */}
          <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-gold-light rounded-lg text-gold shrink-0">
              <WineIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-warm-muted uppercase tracking-widest block font-sans">
                Unique Cuvées
              </span>
              <span className="text-2xl font-bold font-serif text-charcoal mt-1 block">
                {dashboardStats.uniqueWines}
              </span>
            </div>
          </div>

          {/* Cellar Value */}
          <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700 shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-warm-muted uppercase tracking-widest block font-sans">
                Cellar Value
              </span>
              <span className="text-2xl font-bold font-serif text-charcoal mt-1 block">
                ${dashboardStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-warm-muted block mt-0.5 truncate" title={`Based on ${dashboardStats.pctPriced}% of inventory`}>
                Est. value ({dashboardStats.pctPriced}% priced)
              </span>
            </div>
          </div>
        </div>

        {/* Cellar Longevity Timeline */}
        <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-serif font-bold text-burgundy border-b border-warm-border pb-3 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            <span>Cellar Longevity Timeline</span>
          </h3>
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardStats.timelineData}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false}
                  style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fill: 'var(--color-warm-muted)' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', fill: 'var(--color-warm-muted)' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(74, 14, 23, 0.03)' }} />
                <Bar 
                  dataKey="Bottles" 
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                >
                  {dashboardStats.timelineData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.year === selectedYear ? '#C5A059' : '#4A0E17'}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedYear(entry.year)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-warm-muted mt-2 font-sans text-center">
            * Shows how many bottles in stock are within their optimal drink window for each calendar year. Click a bar to view list.
          </p>
        </div>

        {/* Wines to Drink List */}
        <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm">
          <div className="border-b border-warm-border pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-serif font-bold text-burgundy flex items-center gap-2">
                <WineIcon className="h-4.5 w-4.5" />
                <span>Wines to Drink in {selectedYear}</span>
              </h3>
              <p className="text-[11px] text-warm-muted mt-0.5 font-sans">
                {winesForSelectedYear.reduce((acc, w) => acc + w.quantity, 0)} bottles ready for optimal consumption
              </p>
            </div>
            {selectedYear === String(new Date().getFullYear()) && (
              <span className="self-start sm:self-auto bg-gold-light text-gold-dark border border-gold/15 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0">
                Drink Soon
              </span>
            )}
          </div>

          {winesForSelectedYear.length === 0 ? (
            <div className="py-6 text-center text-xs italic text-warm-muted font-serif">
              No dated wines in cellar have their optimal drinking window in {selectedYear}.
            </div>
          ) : (
            <div className="divide-y divide-warm-border/50 max-h-96 overflow-y-auto pr-1">
              {winesForSelectedYear.map((wine) => {
                const endsSoon = wine.drink_until && (wine.drink_until <= Number(selectedYear) + 1)
                
                return (
                  <Link
                    key={wine.id}
                    to={`/wine/${wine.id}`}
                    className="flex items-center justify-between py-3 hover:bg-cream/40 transition-colors group first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-charcoal font-serif font-bold text-sm leading-tight group-hover:text-burgundy transition-colors truncate">
                        {wine.producer}
                      </p>
                      <p className="text-warm-muted text-[10px] mt-1 truncate font-sans">
                        {wine.vintage || 'NV'} · {wine.name || 'Cuvée'}
                        {wine.cellar_location && ` · Loc: ${wine.cellar_location}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      {endsSoon && (
                        <span className="bg-red-50 text-red-700 border border-red-100 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0">
                          {wine.drink_until === Number(selectedYear) ? 'Ends this year' : 'Ends next year'}
                        </span>
                      )}

                      <div className="text-right">
                        <span className="font-serif text-xs font-bold text-charcoal block">
                          {wine.quantity} {wine.quantity === 1 ? 'bottle' : 'bottles'}
                        </span>
                        <span className="text-[9px] text-warm-muted font-mono block mt-0.5 font-sans">
                          Window: {wine.drink_from || 'NV'}–{wine.drink_until || 'Present'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Style Distribution Donut */}
          <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-serif font-bold text-burgundy border-b border-warm-border pb-3 mb-4 flex items-center gap-2">
              <WineIcon className="h-4 w-4" />
              <span>Style Distribution</span>
            </h3>
            {dashboardStats.styleData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-xs italic text-warm-muted">
                No bottles in cellar.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4 flex-1">
                {/* Recharts Pie */}
                <div className="w-40 h-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardStats.styleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {dashboardStats.styleData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={styleColors[entry.name] || defaultColor} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          fontFamily: 'var(--font-sans)', 
                          fontSize: '11px',
                          backgroundColor: '#FFF',
                          border: '1px solid var(--color-warm-border)',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list */}
                <div className="space-y-2 text-xs w-full sm:w-auto">
                  {dashboardStats.styleData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: styleColors[item.name] || defaultColor }}
                        />
                        <span className="font-medium text-charcoal">{item.name}</span>
                      </div>
                      <span className="font-semibold text-warm-muted">{item.value} {item.value === 1 ? 'btl' : 'btls'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Regions Bar Chart */}
          <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-serif font-bold text-burgundy border-b border-warm-border pb-3 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Top Regions</span>
            </h3>
            {dashboardStats.regionData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-xs italic text-warm-muted">
                No bottles in cellar.
              </div>
            ) : (
              <div className="h-48 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardStats.regionData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="region" 
                      type="category" 
                      axisLine={false}
                      tickLine={false}
                      width={90}
                      style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fill: 'var(--color-charcoal)' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(74, 14, 23, 0.03)' }}
                      contentStyle={{ 
                        fontFamily: 'var(--font-sans)', 
                        fontSize: '11px',
                        backgroundColor: '#FFF',
                        border: '1px solid var(--color-warm-border)',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar 
                      dataKey="bottles" 
                      fill="#C5A059" 
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ELO Rankings Widget & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Elo Rankings Card */}
          <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-warm-border pb-3 mb-4">
              <h3 className="text-sm font-serif font-bold text-burgundy flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" />
                <span>Top Elo Rankings</span>
              </h3>
              
              {/* Stephen / Jennifer Toggle */}
              <div className="flex bg-cream border border-warm-border rounded-full p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setRankingPerson('stephen')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    rankingPerson === 'stephen'
                      ? 'bg-burgundy text-white shadow-sm'
                      : 'text-warm-muted hover:text-charcoal'
                  }`}
                >
                  Stephen
                </button>
                <button
                  onClick={() => setRankingPerson('jennifer')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    rankingPerson === 'jennifer'
                      ? 'bg-burgundy text-white shadow-sm'
                      : 'text-warm-muted hover:text-charcoal'
                  }`}
                >
                  Jennifer
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              {topRankedWines.length === 0 ? (
                <div className="py-8 text-center space-y-2 flex-1 flex flex-col justify-center items-center">
                  <Trophy className="h-7 w-7 text-warm-border" />
                  <p className="text-charcoal text-xs font-semibold">No comparison data yet</p>
                  <p className="text-warm-muted text-[10px] max-w-xs leading-relaxed text-center">
                    Compare wines during tastings to build your Elo rankings list here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-warm-border/50">
                  {topRankedWines.map((wine, idx) => {
                    const elo = rankingPerson === 'stephen' ? wine.stephen_elo : wine.jennifer_elo
                    const colors = ['text-gold', 'text-stone-400', 'text-amber-800']
                    
                    return (
                      <Link
                        key={wine.id}
                        to={`/wine/${wine.id}`}
                        className="flex items-center gap-3 py-3 hover:bg-cream/40 transition-colors first:pt-0 last:pb-0"
                      >
                        {/* Rank */}
                        <span className={`text-base font-serif font-black w-6 text-center ${colors[idx] || 'text-warm-muted'}`}>
                          {idx + 1}
                        </span>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-charcoal text-xs font-bold truncate">
                            {wine.producer}
                          </p>
                          <p className="text-warm-muted text-[10px] mt-0.5 truncate font-sans">
                            {wine.vintage || 'NV'} · {wine.name || 'Cuvée'}
                          </p>
                        </div>

                        {/* Elo */}
                        <span className="font-mono text-xs font-bold text-burgundy bg-burgundy-light px-2 py-0.5 rounded shrink-0">
                          {elo.toFixed(0)} ELO
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
              
              <Link 
                to="/cellar" 
                className="mt-4 pt-3 border-t border-warm-border/60 text-xs font-serif font-bold text-burgundy hover:text-burgundy-hover flex items-center justify-center gap-1 hover:gap-1.5 transition-all text-center"
              >
                <span>View Full Cellar List</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-serif font-bold text-burgundy border-b border-warm-border pb-3 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Recent Activity</span>
            </h3>

            <div className="flex-1 flex flex-col justify-between">
              {tastings.length === 0 ? (
                <div className="py-8 text-center space-y-2 flex-1 flex flex-col justify-center items-center">
                  <Calendar className="h-7 w-7 text-warm-border" />
                  <p className="text-charcoal text-xs font-semibold">No recent tastings</p>
                  <p className="text-warm-muted text-[10px] max-w-xs leading-relaxed text-center">
                    Tasting events logged in the system will show up here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-warm-border/50">
                  {tastings.map((t) => (
                    <div key={t.id} className="py-3 first:pt-0 last:pb-0 flex flex-col">
                      <div className="flex items-center justify-between text-[9px] text-warm-muted font-semibold">
                        <span>{new Date(t.tasting_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {t.occasion && <span className="uppercase tracking-wider">{t.occasion}</span>}
                      </div>

                      {t.wines ? (
                        <Link 
                          to={`/wine/${t.wines.id}`}
                          className="text-xs font-bold text-charcoal hover:text-burgundy mt-1 truncate block font-sans"
                        >
                          {t.wines.producer} {t.wines.vintage || 'NV'} {t.wines.name && `· ${t.wines.name}`}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-warm-muted mt-1 italic block font-sans">Non-cellar Wine Tasting</span>
                      )}

                      {t.notes && (
                        <p className="text-[10px] text-warm-muted leading-relaxed truncate mt-1 italic font-sans">
                          "{t.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Link 
                to="/tastings" 
                className="mt-4 pt-3 border-t border-warm-border/60 text-xs font-serif font-bold text-burgundy hover:text-burgundy-hover flex items-center justify-center gap-1 hover:gap-1.5 transition-all text-center"
              >
                <span>View Entire Tasting Log</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
