import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getWineById, getTastingsForWine, getComparisonsForWine } from '../lib/queries'
import type { Wine, Tasting, Comparison } from '../lib/queries'
import { ChevronLeft, MapPin, Calendar, DollarSign, Bookmark, ShoppingBag, Percent, BookOpen, Star, AlertCircle, Sparkles, GitCompare, Plus } from 'lucide-react'
import AddTastingModal from './AddTastingModal'

export default function WineDetail() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const wineId = id || ''

  const onBack = () => {
    // Navigate back, or default to cellar if there is no back history
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/cellar')
    }
  }

  // Fetch Wine Details
  const { data: wine, isLoading: isLoadingWine, error: wineError } = useQuery<Wine | null>({
    queryKey: ['wine', wineId],
    queryFn: () => getWineById(wineId),
    enabled: !!wineId,
  })

  // Fetch Tasting History
  const { data: tastings = [], isLoading: isLoadingTastings } = useQuery<Tasting[]>({
    queryKey: ['tastings', wineId],
    queryFn: () => getTastingsForWine(wineId),
    enabled: !!wineId,
  })

  // Fetch Comparison History
  const { data: comparisons = [] } = useQuery<Comparison[]>({
    queryKey: ['comparisons', wineId],
    queryFn: () => getComparisonsForWine(wineId),
    enabled: !!wineId,
  })

  const currentYear = new Date().getFullYear()

  if (isLoadingWine) {
    return (
      <div className="flex-1 bg-cream flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-burgundy border-t-gold rounded-full animate-spin"></div>
        <p className="text-warm-muted text-xs font-semibold uppercase tracking-wider font-sans">Curating Details...</p>
      </div>
    )
  }

  if (wineError || !wine) {
    return (
      <div className="flex-1 bg-cream flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-burgundy mx-auto" />
        <p className="text-charcoal font-serif font-bold text-base">Wine not found</p>
        <button
          onClick={onBack}
          className="px-5 py-2 bg-burgundy hover:bg-burgundy-hover text-white rounded-lg text-xs font-serif font-bold cursor-pointer transition-colors shadow"
        >
          Back to Cellar
        </button>
      </div>
    )
  }

  // Get style style classes
  const getStyleBadgeClasses = (style: string) => {
    switch (style.toLowerCase()) {
      case 'red':
        return 'bg-burgundy-light text-burgundy border-burgundy/15'
      case 'white':
        return 'bg-gold-light text-gold-dark border-gold/15'
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'sparkling':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'orange':
        return 'bg-orange-50 text-orange-850 border-orange-200'
      case 'dessert':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'fortified':
        return 'bg-red-55/10 text-red-800 border-red-200'
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200'
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
        classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        note: `Too young. Ideal drink window starts in ${from}.`
      }
    }
    if (until && currentYear > until) {
      return {
        label: 'Past Peak',
        classes: 'bg-red-50 text-red-700 border-red-200',
        note: `Past prime drinking window (ended ${until}). Drink soon!`
      }
    }
    return {
      label: 'Optimal Window',
      classes: 'bg-emerald-55/15 text-emerald-800 border-emerald-350',
      note: `Perfect for drinking now. Window: ${from || 'NV'} – ${until || 'Present'}.`
    }
  }

  const drinkWindowInfo = getDrinkWindowInfo()

  return (
    <div className="flex-1 flex flex-col bg-cream overflow-y-auto pb-8 max-w-3xl mx-auto w-full">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-md border-b border-warm-border px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-white hover:bg-cream border border-warm-border text-charcoal hover:border-gold transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-warm-muted text-xs font-bold uppercase tracking-wider font-sans hidden sm:inline">Wine Details</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-burgundy text-white rounded text-xs font-bold font-sans hover:bg-burgundy-hover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Log Tasting
        </button>
      </div>

      {/* Hero Section */}
      <div className="px-5 pt-6 pb-7 bg-white border-b border-warm-border shadow-sm">
        <div className="space-y-2">
          {/* Classification */}
          <span className="text-[10px] font-bold tracking-widest text-gold uppercase block font-sans">
            {wine.classification || 'Classification'}
          </span>
          {/* Producer */}
          <h1 className="text-burgundy font-serif font-black text-2xl md:text-3xl tracking-tight leading-tight">
            {wine.producer}
          </h1>

          {/* Name & Vintage */}
          <div className="flex items-baseline gap-2.5">
            {wine.name && (
              <h2 className="text-charcoal font-serif font-bold text-lg leading-normal">
                {wine.name}
              </h2>
            )}
            <span className="text-burgundy font-serif font-black text-lg">{wine.vintage || 'NV'}</span>
          </div>

          {/* Location details */}
          <div className="flex items-center gap-1.5 text-xs text-warm-muted font-sans">
            <MapPin className="h-4 w-4 text-gold shrink-0" />
            <span>
              {wine.appellation || wine.region || 'Unknown Appellation'}
              {wine.country && `, ${wine.country}`}
            </span>
          </div>

          {/* Label Image if available */}
          {wine.label_photo_url && (
            <div className="mt-5 rounded-xl overflow-hidden border border-warm-border max-h-56 flex items-center justify-center bg-cream/50 p-2 shadow-inner">
              <img
                src={wine.label_photo_url}
                alt={`${wine.producer} Label`}
                className="object-contain max-h-52 w-full rounded"
              />
            </div>
          )}

          {/* Core Info Badges */}
          <div className="flex items-center gap-1.5 pt-4 flex-wrap">
            <span className={`text-[10px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${getStyleBadgeClasses(wine.style)}`}>
              {wine.style}
            </span>
            {drinkWindowInfo && (
              <span className={`text-[10px] px-2.5 py-0.5 rounded border font-bold ${drinkWindowInfo.classes}`}>
                {drinkWindowInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="px-4 py-6 space-y-6">
        {/* Cellar Location & Quantity Card */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-warm-border rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold text-warm-muted uppercase tracking-wider font-sans">
              Cellar Location
            </span>
            <span className="text-charcoal text-base font-bold mt-1 font-mono">
              {wine.cellar_location || 'Not Specified'}
            </span>
          </div>

          <div className="bg-white border border-warm-border rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold text-warm-muted uppercase tracking-wider font-sans">
              Quantity In Cellar
            </span>
            <span className={`text-base font-bold mt-1 font-serif ${wine.quantity > 0 ? 'text-burgundy' : 'text-warm-muted'}`}>
              {wine.quantity} {wine.quantity === 1 ? 'bottle' : 'bottles'}
            </span>
          </div>
        </div>

        {/* Technical Specs Card */}
        <div className="bg-white border border-warm-border rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-serif font-black text-burgundy uppercase tracking-wider flex items-center gap-1.5 border-b border-warm-border pb-2.5">
            <BookOpen className="h-4 w-4 text-gold" />
            <span>Specifications</span>
          </h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-sans">
            <div>
              <span className="text-warm-muted font-semibold">Format:</span>
              <p className="text-charcoal font-bold mt-0.5 capitalize">
                {wine.format ? wine.format.replace('_', ' ') : 'Standard (750ml)'}
              </p>
            </div>
            <div>
              <span className="text-warm-muted font-semibold">Alcohol %:</span>
              <p className="text-charcoal font-bold mt-0.5 flex items-center gap-0.5">
                {wine.alcohol_pct ? (
                  <>
                    <Percent className="h-3 w-3 text-gold" />
                    <span>{wine.alcohol_pct}% ABV</span>
                  </>
                ) : (
                  'Not recorded'
                )}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-warm-muted font-semibold">Grape Varietals:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {wine.varietals.length > 0 ? (
                  wine.varietals.map((v, i) => (
                    <span key={i} className="bg-cream border border-warm-border px-2.5 py-0.5 rounded text-[11px] text-charcoal font-semibold">
                      {v}
                    </span>
                  ))
                ) : (
                  <p className="text-warm-muted italic font-serif">Not specified</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acquisition & Pricing Card */}
        {(wine.purchase_date || wine.purchase_price || wine.purchase_source) && (
          <div className="bg-white border border-warm-border rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-serif font-black text-burgundy uppercase tracking-wider flex items-center gap-1.5 border-b border-warm-border pb-2.5">
              <ShoppingBag className="h-4 w-4 text-gold" />
              <span>Acquisition</span>
            </h3>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-sans">
              {wine.purchase_price && (
                <div>
                  <span className="text-warm-muted font-semibold">Price Paid:</span>
                  <p className="text-emerald-800 font-bold mt-0.5 flex items-center">
                    <DollarSign className="h-3 w-3 text-emerald-700" />
                    <span>{Number(wine.purchase_price).toFixed(2)}</span>
                  </p>
                </div>
              )}
              {wine.purchase_date && (
                <div>
                  <span className="text-warm-muted font-semibold">Purchase Date:</span>
                  <p className="text-charcoal font-bold mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gold" />
                    <span>{new Date(wine.purchase_date).toLocaleDateString()}</span>
                  </p>
                </div>
              )}
              {wine.purchase_source && (
                <div className="col-span-2">
                  <span className="text-warm-muted font-semibold">Source:</span>
                  <p className="text-charcoal font-bold mt-0.5">{wine.purchase_source}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drinking Guidance Banner */}
        {drinkWindowInfo && (
          <div className={`border rounded-xl p-4 flex gap-3 shadow-sm ${
            wine.drink_from && currentYear < wine.drink_from
              ? 'bg-indigo-55/10 border-indigo-200 text-indigo-900'
              : wine.drink_until && currentYear > wine.drink_until
              ? 'bg-red-55/10 border-red-200 text-red-900'
              : 'bg-emerald-55/10 border-emerald-300 text-emerald-900'
          }`}>
            <Bookmark className="h-5 w-5 shrink-0 mt-0.5 text-gold opacity-80" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 font-sans">
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
          <div className="bg-white border border-warm-border rounded-xl p-4.5 space-y-2 shadow-sm">
            <span className="text-[9px] font-bold uppercase tracking-wider text-warm-muted font-sans">
              General Cellar Notes
            </span>
            <p className="font-body italic text-sm text-charcoal/90 leading-relaxed pl-3 border-l-2 border-gold">
              "{wine.notes}"
            </p>
          </div>
        )}

        {/* Tasting History Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-serif font-black text-burgundy uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-gold" />
            <span>Tasting Log ({tastings.length})</span>
          </h3>

          {isLoadingTastings ? (
            <div className="space-y-3">
              <div className="h-20 bg-white border border-warm-border rounded-xl animate-pulse"></div>
              <div className="h-20 bg-white border border-warm-border rounded-xl animate-pulse"></div>
            </div>
          ) : tastings.length === 0 ? (
            <div className="bg-white border border-warm-border rounded-xl p-6 text-center text-warm-muted text-xs font-serif italic shadow-sm">
              No tastings logged for this wine yet.
            </div>
          ) : (
            <div className="space-y-4">
              {tastings.map((tasting) => (
                <div
                  key={tasting.id}
                  className="bg-white border border-warm-border rounded-xl p-5 space-y-3 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-burgundy/10" />

                  {/* Date Header */}
                  <div className="flex items-center gap-1.5 text-xs text-warm-muted font-bold font-sans border-b border-warm-border/50 pb-2">
                    <Calendar className="h-3.5 w-3.5 text-gold" />
                    <span>{new Date(tasting.tasting_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {/* Metadata: occasion, companions, location */}
                  {(tasting.occasion || tasting.location || tasting.companions || tasting.food_pairing) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-warm-muted font-semibold font-sans">
                      {tasting.location && (
                        <div className="flex items-center gap-1">
                          <span className="text-warm-muted">At:</span>
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
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-burgundy bg-burgundy-light border border-burgundy/10 px-2 py-0.5 rounded-md flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            <span>Pairing: {tasting.food_pairing}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasting Notes */}
                  {tasting.notes && (
                    <div className="bg-cream/30 border-l border-gold pl-3 py-0.5 text-charcoal/90 rounded-r-lg">
                      <p className="font-body italic text-sm leading-relaxed">
                        "{tasting.notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === COMPARISONS SECTION === */}
        {comparisons.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-serif font-black text-burgundy uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="h-4 w-4 text-gold" />
              <span>Head-to-Head Comparisons ({comparisons.length})</span>
            </h3>

            <div className="space-y-3">
              {comparisons.map((c) => {
                const opponent = c.wine_a_id === wineId ? c.wine_b : c.wine_a
                const stephenWon = c.stephen_winner === wineId
                const jenniferWon = c.jennifer_winner === wineId

                return (
                  <div key={c.id} className="bg-white border border-warm-border rounded-xl p-5 space-y-3 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold/25" />
                    
                    <div className="flex items-center justify-between border-b border-warm-border/55 pb-2">
                      <span className="text-xs text-warm-muted font-bold font-sans">
                        {new Date(c.comparison_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        {c.occasion && ` · ${c.occasion}`}
                      </span>
                    </div>

                    {/* Opponent */}
                    {opponent ? (
                      <div className="flex items-center gap-2 text-xs font-sans">
                        <span className="text-warm-muted text-[10px] uppercase tracking-wide font-black shrink-0">vs</span>
                        <Link 
                          to={`/wine/${opponent.id}`}
                          className="text-burgundy hover:text-burgundy-hover font-serif font-bold text-sm leading-tight hover:underline"
                        >
                          {opponent.producer} {opponent.vintage || 'NV'} {opponent.name && `· ${opponent.name}`}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-warm-muted italic font-serif">Unknown wine</span>
                    )}

                    {/* Results per person */}
                    <div className="flex gap-2">
                      {c.stephen_winner !== null && (
                        <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                          stephenWon
                            ? 'bg-emerald-55/15 border-emerald-300 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          Stephen: {stephenWon ? 'Won' : 'Lost'}
                        </span>
                      )}
                      {c.jennifer_winner !== null && (
                        <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                          jenniferWon
                            ? 'bg-emerald-55/15 border-emerald-300 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          Jennifer: {jenniferWon ? 'Won' : 'Lost'}
                        </span>
                      )}
                      {c.stephen_winner === null && c.jennifer_winner === null && (
                        <span className="text-[10px] text-warm-muted italic font-serif">Tie / no preference</span>
                      )}
                    </div>

                    {c.notes && (
                      <p className="text-[11px] text-warm-muted italic leading-relaxed font-serif pl-3 border-l border-warm-border">
                        "{c.notes}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AddTastingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        preselectedWineId={wine.id}
      />
    </div>
  )
}
