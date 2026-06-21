import { useQuery } from '@tanstack/react-query'
import { getRecentTastings } from '../lib/queries'
import type { Tasting } from '../lib/queries'
import { Calendar, MapPin, Wine as WineIcon, Star, Quote, Info, ChevronRight } from 'lucide-react'

interface TastingLogProps {
  onSelectWine: (id: string) => void
}

export default function TastingLog({ onSelectWine }: TastingLogProps) {
  const { data: tastings = [], isLoading, error } = useQuery<Tasting[]>({
    queryKey: ['recent-tastings'],
    queryFn: () => getRecentTastings(50),
  })

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get style styles (colors)
  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'red': return 'text-rose-450'
      case 'white': return 'text-amber-200'
      case 'rose': return 'text-pink-300'
      case 'sparkling': return 'text-yellow-200'
      case 'orange': return 'text-orange-300'
      case 'dessert': return 'text-purple-300'
      case 'fortified': return 'text-red-300'
      default: return 'text-zinc-300'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0c0a09]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0c0a09]/95 backdrop-blur-md border-b border-stone-850 px-4 py-4 flex items-center justify-between">
        <h2 className="text-stone-100 font-bold text-lg">Tasting Log</h2>
        <span className="text-xs text-stone-400 font-semibold">{tastings.length} events logged</span>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#131110] border border-stone-850 rounded-xl p-4 space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-stone-800 rounded w-1/4"></div>
                <div className="h-3 bg-stone-800 rounded w-1/5"></div>
              </div>
              <div className="h-4 bg-stone-800 rounded w-2/3"></div>
              <div className="h-10 bg-stone-800/50 rounded-lg"></div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-12 px-4">
            <Info className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="text-stone-300 text-sm font-semibold">Failed to load tastings</p>
            <p className="text-stone-500 text-xs mt-1">Please verify your connection.</p>
          </div>
        ) : tastings.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Quote className="h-10 w-10 text-stone-600 mx-auto mb-3" />
            <p className="text-stone-400 text-sm font-semibold">No tastings logged yet</p>
            <p className="text-stone-600 text-xs mt-1">Logged tastings from your Claude Project will appear here.</p>
          </div>
        ) : (
          tastings.map((tasting) => (
            <div
              key={tasting.id}
              className="bg-[#131110] border border-stone-850 rounded-xl p-4 flex flex-col gap-3 shadow-md"
            >
              {/* Date & Ratings Row */}
              <div className="flex items-center justify-between border-b border-stone-850/65 pb-2">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-stone-500" />
                  <span>{formatDate(tasting.tasting_date)}</span>
                </div>
              </div>

              {/* Linked Wine / Event Name */}
              {tasting.wines ? (
                <div
                  onClick={() => onSelectWine(tasting.wines!.id)}
                  className="group flex items-center justify-between bg-stone-900/40 hover:bg-stone-900/80 border border-stone-850 hover:border-stone-800 p-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] duration-150"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="text-stone-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <WineIcon className={`h-3 w-3 ${getStyleColor(tasting.wines.style)}`} />
                      <span>{tasting.wines.producer}</span>
                    </div>
                    <p className="text-stone-200 text-xs font-semibold truncate">
                      {tasting.wines.name || 'Cuvée'}
                      <span className="text-rose-400 font-extrabold ml-1">
                        {tasting.wines.vintage || 'NV'}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-stone-300 transition-colors shrink-0" />
                </div>
              ) : (
                <div className="bg-stone-900/10 border border-dashed border-stone-850 p-2 rounded-lg text-stone-400 text-xs italic">
                  Non-cellar Wine (Tasted Elsewhere)
                </div>
              )}

              {/* Location & Occasion details */}
              {(tasting.location || tasting.occasion || tasting.companions || tasting.food_pairing) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-stone-400 font-semibold">
                  {tasting.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-stone-500" />
                      <span className="text-stone-300">{tasting.location}</span>
                    </div>
                  )}
                  {tasting.occasion && (
                    <div>
                      <span className="text-stone-500">Occasion:</span>{' '}
                      <span className="text-stone-300">{tasting.occasion}</span>
                    </div>
                  )}
                  {tasting.companions && (
                    <div>
                      <span className="text-stone-500">With:</span>{' '}
                      <span className="text-stone-300">{tasting.companions}</span>
                    </div>
                  )}
                  {tasting.food_pairing && (
                    <span className="text-rose-455 text-[10px] bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                      <Star className="h-2.5 w-2.5 inline fill-current" />
                      <span>Pairing: {tasting.food_pairing}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Tasting Note */}
              {tasting.notes && (
                <p className="text-xs text-stone-300 leading-relaxed font-normal bg-stone-950/40 p-2.5 rounded-lg border border-stone-850/60">
                  {tasting.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
