import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getRecentTastings } from '../lib/queries'
import type { Tasting } from '../lib/queries'
import { Calendar, MapPin, Wine as WineIcon, Star, Quote, Info, ChevronRight } from 'lucide-react'

export default function TastingLog() {
  const { data: tastings = [], isLoading, error } = useQuery<Tasting[]>({
    queryKey: ['recent-tastings'],
    queryFn: () => getRecentTastings(50),
  })

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get style styles (colors)
  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'red': return 'text-burgundy'
      case 'white': return 'text-gold'
      case 'rose': return 'text-rose-500'
      case 'sparkling': return 'text-yellow-600'
      case 'orange': return 'text-orange-600'
      case 'dessert': return 'text-purple-600'
      case 'fortified': return 'text-red-700'
      default: return 'text-stone-500'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-cream max-w-5xl mx-auto w-full pt-4">

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-warm-border rounded-xl p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-center pb-2 border-b border-warm-border/30">
                <div className="h-3 bg-cream rounded w-1/4"></div>
                <div className="h-3 bg-cream rounded w-1/5"></div>
              </div>
              <div className="h-4 bg-cream rounded w-2/3"></div>
              <div className="h-12 bg-cream rounded-lg"></div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-12 px-4">
            <Info className="h-8 w-8 text-burgundy mx-auto mb-2" />
            <p className="text-charcoal text-sm font-bold font-serif">Failed to load tastings</p>
            <p className="text-warm-muted text-xs mt-1">Please verify your connection.</p>
          </div>
        ) : tastings.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Quote className="h-10 w-10 text-warm-border mx-auto mb-3" />
            <p className="text-charcoal text-sm font-bold font-serif">No tastings logged yet</p>
            <p className="text-warm-muted text-xs mt-1">Logged tastings from your Claude Project will appear here.</p>
          </div>
        ) : (
          tastings.map((tasting) => (
            <div
              key={tasting.id}
              className="bg-white border border-warm-border rounded-xl p-5 flex flex-col gap-3.5 shadow-sm relative overflow-hidden group"
            >
              {/* Vertical accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-burgundy/10 group-hover:bg-burgundy/30 transition-colors" />

              {/* Date Header Row */}
              <div className="flex items-center justify-between border-b border-warm-border/50 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs text-warm-muted font-bold font-sans">
                  <Calendar className="h-3.5 w-3.5 text-gold" />
                  <span>{formatDate(tasting.tasting_date)}</span>
                </div>
              </div>

              {/* Linked Wine / Event Name */}
              {tasting.wines ? (
                <Link
                  to={`/wine/${tasting.wines.id}`}
                  className="group flex items-center justify-between bg-cream/50 hover:bg-burgundy-light/20 border border-warm-border hover:border-gold p-3.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] duration-150"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="text-warm-muted text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                      <WineIcon className={`h-3 w-3 ${getStyleColor(tasting.wines.style)}`} />
                      <span className="truncate">{tasting.wines.producer}</span>
                    </div>
                    <p className="text-charcoal text-sm font-serif font-bold truncate">
                      {tasting.wines.name || 'Cuvée'}
                      <span className="text-burgundy font-serif font-extrabold ml-1.5">
                        {tasting.wines.vintage || 'NV'}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-warm-muted group-hover:text-burgundy transition-colors shrink-0" />
                </Link>
              ) : (
                <div className="bg-cream/40 border border-dashed border-warm-border p-2.5 rounded-lg text-warm-muted text-xs italic font-serif">
                  Non-cellar Wine (Tasted Elsewhere)
                </div>
              )}

              {/* Location & Occasion details */}
              {(tasting.location || tasting.occasion || tasting.companions || tasting.food_pairing) && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-warm-muted font-semibold font-sans">
                  {tasting.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="text-charcoal">{tasting.location}</span>
                    </div>
                  )}
                  {tasting.occasion && (
                    <div className="flex items-center gap-1">
                      <span className="text-warm-muted">Occasion:</span>
                      <span className="text-charcoal">{tasting.occasion}</span>
                    </div>
                  )}
                  {tasting.companions && (
                    <div className="flex items-center gap-1">
                      <span className="text-warm-muted">With:</span>
                      <span className="text-charcoal">{tasting.companions}</span>
                    </div>
                  )}
                  {tasting.food_pairing && (
                    <div className="flex items-center gap-1 font-sans">
                      <span className="text-burgundy bg-burgundy-light border border-burgundy/10 px-2 py-0.5 rounded-md flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider shrink-0">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span>Pairing: {tasting.food_pairing}</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tasting Note */}
              {tasting.notes && (
                <div className="bg-cream/30 border-l-2 border-gold pl-3.5 py-1 text-charcoal/90 rounded-r-lg">
                  <p className="font-body italic text-sm leading-relaxed">
                    "{tasting.notes}"
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
