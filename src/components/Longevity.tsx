import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getWines, getTotalQuantity } from '../lib/queries'
import type { Wine } from '../lib/queries'
import { Calendar } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

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

export default function Longevity() {
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))

  // Fetch wines (in cellar + out)
  const { data: wines = [], isLoading } = useQuery<Wine[]>({
    queryKey: ['wines-longevity'],
    queryFn: () => getWines(false),
  })

  const { timelineData, winesForSelectedYear } = useMemo(() => {
    const inCellar = wines.filter(w => getTotalQuantity(w) > 0)
    
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
            bottles += getTotalQuantity(w)
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

    // Get wines ready to drink in the selected year
    const yearNum = Number(selectedYear)
    const winesForSelectedYear = inCellar.filter(w => {
      const from = w.drink_from
      const until = w.drink_until
      if (!from && !until) return false
      return (!from || yearNum >= from) && (!until || yearNum <= until)
    })

    return { timelineData, winesForSelectedYear }
  }, [wines, selectedYear])

  if (isLoading) {
    return (
      <div className="flex-1 bg-cream flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-burgundy border-t-gold rounded-full animate-spin"></div>
        <p className="text-warm-muted text-xs font-semibold uppercase tracking-wider font-sans">
          Curating Longevity Profile...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-cream pb-8 px-4 md:px-8 max-w-5xl mx-auto w-full pt-6">
      <div className="space-y-6">
        {/* Cellar Longevity Timeline */}
        <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-serif font-bold text-burgundy border-b border-warm-border pb-3 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            <span>Cellar Longevity Timeline</span>
          </h3>
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
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
                  {timelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.year === selectedYear ? '#C5A059' : '#D8C3A5'} 
                      onClick={() => setSelectedYear(entry.year)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10px] text-warm-muted uppercase tracking-wider font-bold mt-4 font-sans">
            Tap a year to view wines ready to drink
          </p>
        </div>

        {/* Wines to Drink in Selected Year */}
        <div className="bg-white border border-warm-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-warm-border pb-3 mb-4">
            <h3 className="text-sm font-serif font-bold text-charcoal flex items-center gap-2">
              Wines to Drink in <span className="text-burgundy px-2 py-0.5 bg-burgundy-light rounded-md">{selectedYear}</span>
            </h3>
            <span className="text-xs font-bold text-warm-muted font-sans">
              {winesForSelectedYear.length} {winesForSelectedYear.length === 1 ? 'bottle' : 'bottles'}
            </span>
          </div>

          {winesForSelectedYear.length === 0 ? (
            <div className="py-8 text-center text-xs italic text-warm-muted">
              No wines found that are ready to drink in {selectedYear}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 no-scrollbar">
              {winesForSelectedYear.map(wine => {
                const endsSoon = wine.drink_until === Number(selectedYear) || wine.drink_until === Number(selectedYear) + 1
                const qty = getTotalQuantity(wine)
                const locs = wine.wine_stock?.filter(s => s.quantity > 0 && s.cellar_location).map(s => s.cellar_location).join(', ')
                return (
                  <Link
                    key={wine.id}
                    to={`/wine/${wine.id}`}
                    className="group flex items-center justify-between p-3 rounded-lg border border-warm-border hover:border-gold hover:shadow-sm transition-all bg-cream/30 hover:bg-white cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-charcoal font-serif font-bold text-sm leading-tight group-hover:text-burgundy transition-colors truncate">
                        {wine.producer}
                      </p>
                      <p className="text-warm-muted text-[10px] mt-1 truncate font-sans">
                        {wine.vintage || 'NV'} · {wine.name || 'Cuvée'}
                        {locs && ` · Loc: ${locs}`}
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
                          {qty} {qty === 1 ? 'bottle' : 'bottles'}
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
      </div>
    </div>
  )
}
