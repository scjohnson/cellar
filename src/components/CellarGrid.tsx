import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWines } from '../lib/queries'
import type { Wine } from '../lib/queries'
import { Search, Filter, Wine as WineIcon, MapPin, Calendar, Info } from 'lucide-react'

interface CellarGridProps {
  onSelectWine: (id: string) => void
}

type SortField = 'producer' | 'vintage' | 'quantity' | 'region'
type SortOrder = 'asc' | 'desc'

export default function CellarGrid({ onSelectWine }: CellarGridProps) {
  const { data: wines = [], isLoading, error } = useQuery<Wine[]>({
    queryKey: ['wines'],
    queryFn: () => getWines(false), // Fetch all wines (including quantity = 0 so we can show out of stock toggle if desired)
  })

  // State
  const [search, setSearch] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [readyToDrinkOnly, setReadyToDrinkOnly] = useState(false)
  const [inStockOnly, setInStockOnly] = useState(true)
  const [sortField, setSortField] = useState<SortField>('producer')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Current year for drink window checks
  const currentYear = new Date().getFullYear()

  // Get unique regions and styles for filter dropdowns
  const regions = useMemo(() => {
    const allRegions = wines
      .map(w => w.region)
      .filter((r): r is string => !!r)
    return ['all', ...Array.from(new Set(allRegions))].sort()
  }, [wines])

  const styles = ['all', 'red', 'white', 'rose', 'sparkling', 'dessert', 'orange', 'fortified']

  // Handle sorting toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder(field === 'vintage' || field === 'quantity' ? 'desc' : 'asc')
    }
  }

  // Filter and sort wines
  const filteredAndSortedWines = useMemo(() => {
    let result = [...wines]

    // 1. In Stock Filter
    if (inStockOnly) {
      result = result.filter(w => w.quantity > 0)
    }

    // 2. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        w =>
          w.producer.toLowerCase().includes(q) ||
          (w.name && w.name.toLowerCase().includes(q)) ||
          (w.region && w.region.toLowerCase().includes(q)) ||
          (w.appellation && w.appellation.toLowerCase().includes(q)) ||
          w.varietals.some(v => v.toLowerCase().includes(q))
      )
    }

    // 3. Style Filter
    if (selectedStyle !== 'all') {
      result = result.filter(w => w.style.toLowerCase() === selectedStyle.toLowerCase())
    }

    // 4. Region Filter
    if (selectedRegion !== 'all') {
      result = result.filter(w => w.region === selectedRegion)
    }

    // 5. Ready to Drink Filter
    if (readyToDrinkOnly) {
      result = result.filter(w => {
        const from = w.drink_from || 0
        const until = w.drink_until || 9999
        return currentYear >= from && currentYear <= until
      })
    }

    // 6. Sorting
    result.sort((a, b) => {
      let comparison = 0

      if (sortField === 'producer') {
        comparison = a.producer.localeCompare(b.producer)
      } else if (sortField === 'vintage') {
        const aV = a.vintage || 0
        const bV = b.vintage || 0
        comparison = aV - bV
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity
      } else if (sortField === 'region') {
        const aR = a.region || ''
        const bR = b.region || ''
        comparison = aR.localeCompare(bR)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [wines, search, selectedStyle, selectedRegion, readyToDrinkOnly, inStockOnly, sortField, sortOrder, currentYear])

  // Get style styles (colors)
  const getStyleBadge = (style: string) => {
    switch (style.toLowerCase()) {
      case 'red':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60'
      case 'white':
        return 'bg-amber-950/40 text-amber-200 border-amber-800/40'
      case 'rose':
        return 'bg-pink-950/60 text-pink-300 border-pink-800/40'
      case 'sparkling':
        return 'bg-yellow-950/60 text-yellow-200 border-yellow-800/40 animate-pulse-subtle'
      case 'orange':
        return 'bg-orange-950/60 text-orange-300 border-orange-800/40'
      case 'dessert':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/40'
      case 'fortified':
        return 'bg-red-950/60 text-red-300 border-red-950/40'
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700'
    }
  }

  // Check drink window status
  const getDrinkWindowStatus = (w: Wine) => {
    if (!w.drink_from && !w.drink_until) return null

    const from = w.drink_from
    const until = w.drink_until

    if (from && currentYear < from) {
      return {
        label: `Hold (Ready ${from})`,
        classes: 'bg-indigo-950/80 text-indigo-300 border-indigo-900/60',
        window: `${from}–${until || '?'}`
      }
    }

    if (until && currentYear > until) {
      return {
        label: 'Past Window',
        classes: 'bg-red-950/60 text-red-400 border-red-900/40',
        window: `${from || '?'}-${until}`
      }
    }

    return {
      label: 'Ready to Drink',
      classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60',
      window: `${from || '?'}-${until || '?'}`
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c0a09]">
      {/* Search and Filters Bar */}
      <div className="sticky top-0 z-10 bg-[#0c0a09]/95 backdrop-blur-md border-b border-stone-850 px-4 pt-3 pb-3 space-y-3">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search producer, grape, region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg pl-9 pr-4 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-700 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all ${
              showFilters || selectedRegion !== 'all' || readyToDrinkOnly || !inStockOnly
                ? 'bg-[#4c0519] border-rose-900 text-rose-200'
                : 'bg-stone-900 border-stone-850 text-stone-300'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Style pills (horizontal scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
          {styles.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all capitalize font-medium ${
                selectedStyle === style
                  ? 'bg-rose-900 border-rose-800 text-stone-100 shadow-sm'
                  : 'bg-stone-900 border-stone-850 text-stone-400 hover:text-stone-200'
              }`}
            >
              {style === 'all' ? 'All Styles' : style}
            </button>
          ))}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showFilters && (
          <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-3.5 space-y-3 animate-slide-down">
            <div className="grid grid-cols-2 gap-3">
              {/* Region Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:outline-none"
                >
                  <option value="all">All Regions</option>
                  {regions.map((r) => r !== 'all' && (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* In Cellar Toggle */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                  Inventory status
                </label>
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-all ${
                    inStockOnly
                      ? 'bg-stone-900 border-stone-800 text-stone-200'
                      : 'bg-rose-950/20 border-rose-900/55 text-rose-300'
                  }`}
                >
                  <span>{inStockOnly ? 'Currently In Cellar' : 'Include Drunk / Empty'}</span>
                  <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-500' : 'bg-stone-600'}`}></span>
                </button>
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => setReadyToDrinkOnly(!readyToDrinkOnly)}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                  readyToDrinkOnly
                    ? 'bg-emerald-950/60 border-emerald-900 text-emerald-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                }`}
              >
                <Calendar className="h-3 w-3" />
                <span>Ready to Drink ({currentYear})</span>
              </button>
            </div>
          </div>
        )}

        {/* Sort & Count row */}
        <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-850/40">
          <span>{filteredAndSortedWines.length} wines found</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500">Sort by:</span>
            <button
              onClick={() => handleSort('producer')}
              className={`flex items-center gap-0.5 font-medium hover:text-stone-200 ${sortField === 'producer' ? 'text-rose-400 font-bold' : ''}`}
            >
              Producer {sortField === 'producer' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('vintage')}
              className={`flex items-center gap-0.5 font-medium hover:text-stone-200 ${sortField === 'vintage' ? 'text-rose-400 font-bold' : ''}`}
            >
              Vintage {sortField === 'vintage' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('quantity')}
              className={`flex items-center gap-0.5 font-medium hover:text-stone-200 ${sortField === 'quantity' ? 'text-rose-400 font-bold' : ''}`}
            >
              Qty {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-stone-900/50 border border-stone-850 rounded-xl p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-stone-800 rounded w-2/3"></div>
              <div className="h-3 bg-stone-800 rounded w-1/2"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 bg-stone-800 rounded w-1/4"></div>
                <div className="h-5 bg-stone-800 rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-12 px-4">
            <Info className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="text-stone-300 text-sm font-semibold">Failed to load wine cellar</p>
            <p className="text-stone-500 text-xs mt-1">Please verify your connection and Supabase URL.</p>
          </div>
        ) : filteredAndSortedWines.length === 0 ? (
          <div className="text-center py-16 px-4">
            <WineIcon className="h-10 w-10 text-stone-600 mx-auto mb-3" />
            <p className="text-stone-400 text-sm font-semibold">No wines found</p>
            <p className="text-stone-650 text-xs mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          filteredAndSortedWines.map((wine) => {
            const drinkStatus = getDrinkWindowStatus(wine)
            return (
              <div
                key={wine.id}
                onClick={() => onSelectWine(wine.id)}
                className="group relative bg-[#131110] hover:bg-[#1a1716] border border-stone-850 hover:border-stone-750 transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer shadow-md active:scale-[0.99] duration-150"
              >
                {/* Out of stock watermark overlay */}
                {wine.quantity === 0 && (
                  <div className="absolute top-0 right-0 bg-stone-850/80 border-b border-l border-stone-750 text-[10px] uppercase font-bold text-stone-400 px-2 py-1 rounded-bl-lg rounded-tr-xl">
                    Out of Stock
                  </div>
                )}

                <div className="space-y-1">
                  {/* Producer */}
                  <h3 className="text-stone-100 font-bold text-base leading-snug group-hover:text-rose-100 transition-colors">
                    {wine.producer}
                  </h3>

                  {/* Name and Vintage */}
                  <div className="flex items-baseline gap-1.5">
                    {wine.name && (
                      <span className="text-stone-300 text-sm font-medium">
                        {wine.name}
                      </span>
                    )}
                    <span className="text-rose-400 text-sm font-bold">
                      {wine.vintage || 'NV'}
                    </span>
                  </div>

                  {/* Appellation & Region */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-400 pt-0.5">
                    <MapPin className="h-3 w-3 text-stone-500 shrink-0" />
                    <span className="truncate">
                      {wine.appellation || wine.region || 'Unknown Region'}
                      {wine.country && `, ${wine.country}`}
                    </span>
                  </div>
                </div>

                {/* Badges & Qty Row */}
                <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-stone-850/50">
                  {/* Style & Drink window badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold tracking-wide uppercase ${getStyleBadge(wine.style)}`}>
                      {wine.style}
                    </span>
                    {drinkStatus && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${drinkStatus.classes}`}>
                        {drinkStatus.label}
                      </span>
                    )}
                  </div>

                  {/* Qty & Location indicator */}
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-black ${wine.quantity > 0 ? 'text-stone-200' : 'text-stone-500'}`}>
                      {wine.quantity} {wine.quantity === 1 ? 'bottle' : 'bottles'}
                    </span>
                    {wine.cellar_location && (
                      <span className="text-[10px] text-stone-500 font-mono mt-0.5">
                        Loc: {wine.cellar_location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
