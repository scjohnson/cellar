import { useQuery } from '@tanstack/react-query'
import { getWineById, getTastingsForWine, getComparisonsForWine } from '../lib/queries'
import type { Wine, Tasting, Comparison } from '../lib/queries'
import { ChevronLeft, MapPin, Calendar, DollarSign, Bookmark, ShoppingBag, Percent, BookOpen, Star, AlertCircle, Sparkles, GitCompare } from 'lucide-react'

interface WineDetailProps {
  wineId: string
  onBack: () => void
}

export default function WineDetail({ wineId, onBack }: WineDetailProps) {
  // Fetch Wine Details
  const { data: wine, isLoading: isLoadingWine, error: wineError } = useQuery<Wine | null>({
    queryKey: ['wine', wineId],
    queryFn: () => getWineById(wineId),
  })

  // Fetch Tasting History
  const { data: tastings = [], isLoading: isLoadingTastings } = useQuery<Tasting[]>({
    queryKey: ['tastings', wineId],
    queryFn: () => getTastingsForWine(wineId),
  })

  // Fetch Comparison History
  const { data: comparisons = [] } = useQuery<Comparison[]>({
    queryKey: ['comparisons', wineId],
    queryFn: () => getComparisonsForWine(wineId),
  })

  const currentYear = new Date().getFullYear()

  if (isLoadingWine) {
    return (
      <div className="flex-1 bg-[#0c0a09] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-rose-900 border-t-rose-400 rounded-full animate-spin"></div>
        <p className="text-stone-400 text-xs font-medium">Loading wine details...</p>
      </div>
    )
  }

  if (wineError || !wine) {
    return (
      <div className="flex-1 bg-[#0c0a09] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <p className="text-stone-300 font-bold text-sm">Wine not found</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs font-semibold text-stone-200"
        >
          Back to Cellar
        </button>
      </div>
    )
  }

  // Get style styles (colors)
  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'red': return 'text-rose-400'
      case 'white': return 'text-amber-200'
      case 'rose': return 'text-pink-300'
      case 'sparkling': return 'text-yellow-200'
      case 'orange': return 'text-orange-300'
      case 'dessert': return 'text-purple-300'
      case 'fortified': return 'text-red-300'
      default: return 'text-zinc-300'
    }
  }

  // Get drink window status details
  const getDrinkWindowInfo = () => {
    if (!wine.drink_from && !wine.drink_until) return null
    const from = wine.drink_from
    const until = wine.drink_until

    if (from && currentYear < from) {
      return {
        label: `Hold (Ready in ${from})`,
        classes: 'bg-indigo-950/70 text-indigo-300 border-indigo-900/50',
        note: `Too young. Ideal drink window starts in ${from}.`
      }
    }
    if (until && currentYear > until) {
      return {
        label: 'Past Peak',
        classes: 'bg-red-950/60 text-red-400 border-red-900/40',
        note: `Past prime drinking window (ended ${until}). Drink soon!`
      }
    }
    return {
      label: 'Optimal Window',
      classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60',
      note: `Perfect for drinking now. Window: ${from || 'NV'} – ${until || 'Present'}.`
    }
  }

  const drinkWindowInfo = getDrinkWindowInfo()

  return (
    <div className="flex-1 flex flex-col bg-[#0c0a09] overflow-y-auto pb-8">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-[#0c0a09]/95 backdrop-blur-md border-b border-stone-850 px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-stone-300 text-sm font-semibold truncate">Wine Details</span>
      </div>

      {/* Hero Section */}
      <div className="px-4 pt-5 pb-6 bg-gradient-to-b from-[#131110] to-[#0c0a09] border-b border-stone-850">
        <div className="space-y-2">
          {/* Producer */}
          <span className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            {wine.classification || 'Producer'}
          </span>
          <h1 className="text-stone-100 font-extrabold text-2xl tracking-tight leading-snug">
            {wine.producer}
          </h1>

          {/* Name & Vintage */}
          <div className="flex items-baseline gap-2">
            {wine.name && (
              <h2 className="text-stone-200 text-lg font-medium leading-normal">
                {wine.name}
              </h2>
            )}
            <span className="text-rose-400 text-lg font-extrabold">{wine.vintage || 'NV'}</span>
          </div>

          {/* Location details */}
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <MapPin className="h-3.5 w-3.5 text-stone-500 shrink-0" />
            <span>
              {wine.appellation || wine.region || 'Unknown Appellation'}
              {wine.country && `, ${wine.country}`}
            </span>
          </div>

          {/* Label Image if available */}
          {wine.label_photo_url && (
            <div className="mt-4 rounded-xl overflow-hidden border border-stone-800 max-h-48 flex items-center justify-center bg-stone-950">
              <img
                src={wine.label_photo_url}
                alt={`${wine.producer} Label`}
                className="object-contain max-h-48 w-full"
              />
            </div>
          )}

          {/* Core Info Badges */}
          <div className="flex items-center gap-1.5 pt-3 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wider bg-stone-900 border-stone-800 ${getStyleColor(wine.style)}`}>
              {wine.style}
            </span>
            {drinkWindowInfo && (
              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${drinkWindowInfo.classes}`}>
                {drinkWindowInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="px-4 py-5 space-y-6">
        {/* Cellar Location & Quantity Card */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-[#131110] border border-stone-850 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
              Cellar Location
            </span>
            <span className="text-stone-200 text-base font-bold mt-1 font-mono">
              {wine.cellar_location || 'Not Specified'}
            </span>
          </div>

          <div className="bg-[#131110] border border-stone-850 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
              Quantity In Cellar
            </span>
            <span className={`text-base font-black mt-1 ${wine.quantity > 0 ? 'text-rose-400' : 'text-stone-500'}`}>
              {wine.quantity} {wine.quantity === 1 ? 'bottle' : 'bottles'}
            </span>
          </div>
        </div>

        {/* Technical Specs Card */}
        <div className="bg-[#131110]/50 border border-stone-850 rounded-xl p-4.5 space-y-3.5">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-850/60 pb-2">
            <BookOpen className="h-3.5 w-3.5 text-stone-500" />
            <span>Specifications</span>
          </h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <span className="text-stone-500">Format:</span>
              <p className="text-stone-300 font-medium capitalize mt-0.5">
                {wine.format ? wine.format.replace('_', ' ') : 'Standard (750ml)'}
              </p>
            </div>
            <div>
              <span className="text-stone-500">Alcohol %:</span>
              <p className="text-stone-300 font-medium mt-0.5 flex items-center gap-0.5">
                {wine.alcohol_pct ? (
                  <>
                    <Percent className="h-3 w-3 text-stone-500" />
                    <span>{wine.alcohol_pct}% ABV</span>
                  </>
                ) : (
                  'Not recorded'
                )}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-stone-500">Grape Varietals:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {wine.varietals.length > 0 ? (
                  wine.varietals.map((v, i) => (
                    <span key={i} className="bg-stone-900 border border-stone-850/80 px-2 py-0.5 rounded text-[11px] text-stone-300 font-medium">
                      {v}
                    </span>
                  ))
                ) : (
                  <p className="text-stone-500 italic">Not specified</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acquisition & Pricing Card */}
        {(wine.purchase_date || wine.purchase_price || wine.purchase_source) && (
          <div className="bg-[#131110]/50 border border-stone-850 rounded-xl p-4.5 space-y-3.5">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-850/60 pb-2">
              <ShoppingBag className="h-3.5 w-3.5 text-stone-500" />
              <span>Acquisition</span>
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              {wine.purchase_price && (
                <div>
                  <span className="text-stone-500">Price Paid:</span>
                  <p className="text-emerald-400 font-bold mt-0.5 flex items-center">
                    <DollarSign className="h-3 w-3 text-emerald-500" />
                    <span>{Number(wine.purchase_price).toFixed(2)}</span>
                  </p>
                </div>
              )}
              {wine.purchase_date && (
                <div>
                  <span className="text-stone-500">Purchase Date:</span>
                  <p className="text-stone-300 font-medium mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-stone-500" />
                    <span>{new Date(wine.purchase_date).toLocaleDateString()}</span>
                  </p>
                </div>
              )}
              {wine.purchase_source && (
                <div className="col-span-2">
                  <span className="text-stone-500">Source:</span>
                  <p className="text-stone-300 font-medium mt-0.5">{wine.purchase_source}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drinking Guidance Banner */}
        {drinkWindowInfo && (
          <div className={`border rounded-xl p-4 flex gap-3 ${
            wine.drink_from && currentYear < wine.drink_from
              ? 'bg-indigo-950/15 border-indigo-900/40 text-indigo-200'
              : wine.drink_until && currentYear > wine.drink_until
              ? 'bg-red-950/10 border-red-900/30 text-red-300'
              : 'bg-emerald-950/15 border-emerald-900/30 text-emerald-200'
          }`}>
            <Bookmark className="h-5 w-5 shrink-0 mt-0.5 opacity-80" />
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                Drinking Guidance
              </span>
              <p className="text-xs leading-relaxed font-semibold">
                {drinkWindowInfo.note}
              </p>
            </div>
          </div>
        )}

        {/* General Notes */}
        {wine.notes && (
          <div className="bg-stone-900/20 border border-stone-850/70 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              General Cellar Notes
            </span>
            <p className="text-xs text-stone-300 leading-relaxed italic">
              "{wine.notes}"
            </p>
          </div>
        )}

        {/* Tasting History Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-rose-400" />
            <span>Tasting Log ({tastings.length})</span>
          </h3>

          {isLoadingTastings ? (
            <div className="space-y-3">
              <div className="h-20 bg-stone-900 rounded-xl animate-pulse"></div>
              <div className="h-20 bg-stone-900 rounded-xl animate-pulse"></div>
            </div>
          ) : tastings.length === 0 ? (
            <div className="bg-[#131110] border border-stone-850 rounded-xl p-6 text-center text-stone-600 text-xs">
              No tastings logged for this wine yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tastings.map((tasting) => (
                <div
                  key={tasting.id}
                  className="bg-[#131110] border border-stone-850 rounded-xl p-4 space-y-3"
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-1 text-[11px] font-medium text-stone-400 border-b border-stone-850/60 pb-2">
                    <Calendar className="h-3 w-3 text-stone-500" />
                    <span>{new Date(tasting.tasting_date).toLocaleDateString()}</span>
                  </div>

                  {/* Metadata: occasion, companions, location */}
                  {(tasting.occasion || tasting.location || tasting.companions || tasting.food_pairing) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-stone-400 font-medium">
                      {tasting.location && (
                        <div className="flex items-center gap-1">
                          <span className="text-stone-500">At:</span>
                          <span className="text-stone-300">{tasting.location}</span>
                        </div>
                      )}
                      {tasting.occasion && (
                        <div className="flex items-center gap-1">
                          <span className="text-stone-500">Occasion:</span>
                          <span className="text-stone-300">{tasting.occasion}</span>
                        </div>
                      )}
                      {tasting.companions && (
                        <div className="flex items-center gap-1">
                          <span className="text-stone-500">With:</span>
                          <span className="text-stone-300">{tasting.companions}</span>
                        </div>
                      )}
                      {tasting.food_pairing && (
                        <div className="flex items-center gap-1 col-span-2 mt-0.5">
                          <span className="text-rose-450 text-[10px] bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 inline fill-current" />
                            <span>Pairing: {tasting.food_pairing}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasting Notes */}
                  {tasting.notes && (
                    <p className="text-xs text-stone-300 leading-relaxed font-normal bg-stone-950/40 p-2.5 rounded-lg border border-stone-850/60">
                      {tasting.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === COMPARISONS SECTION === */}
        {comparisons.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="h-4 w-4 text-stone-500" />
              <span>Head-to-Head Comparisons ({comparisons.length})</span>
            </h3>

            <div className="space-y-3">
              {comparisons.map((c) => {
                const opponent = c.wine_a_id === wineId ? c.wine_b : c.wine_a
                const stephenWon = c.stephen_winner === wineId
                const jenniferWon = c.jennifer_winner === wineId

                return (
                  <div key={c.id} className="bg-[#131110] border border-stone-850 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-stone-500 font-medium">
                        {new Date(c.comparison_date).toLocaleDateString()}
                        {c.occasion && ` · ${c.occasion}`}
                      </span>
                    </div>

                    {/* Opponent */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-500 text-[10px] uppercase tracking-wide font-bold shrink-0">vs</span>
                      <span className="text-stone-200 font-semibold">
                        {opponent?.producer}
                        {opponent?.name && ` · ${opponent.name}`}
                        {opponent?.vintage && <span className="text-rose-400 font-bold ml-1">{opponent.vintage}</span>}
                      </span>
                    </div>

                    {/* Results per person */}
                    <div className="flex gap-2">
                      {c.stephen_winner !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          stephenWon
                            ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400'
                            : 'bg-red-950/30 border-red-900/30 text-red-400'
                        }`}>
                          S: {stephenWon ? 'Won' : 'Lost'}
                        </span>
                      )}
                      {c.jennifer_winner !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          jenniferWon
                            ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400'
                            : 'bg-red-950/30 border-red-900/30 text-red-400'
                        }`}>
                          J: {jenniferWon ? 'Won' : 'Lost'}
                        </span>
                      )}
                      {c.stephen_winner === null && c.jennifer_winner === null && (
                        <span className="text-[10px] text-stone-500 italic">Tie / no preference</span>
                      )}
                    </div>

                    {c.notes && (
                      <p className="text-[10px] text-stone-400 italic leading-relaxed">{c.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
