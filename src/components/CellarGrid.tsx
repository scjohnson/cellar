import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getWines, getTotalQuantity } from '../lib/queries'
import type { Wine } from '../lib/queries'
import { Search, Filter, Wine as WineIcon, MapPin, Calendar, Info, BarChart3, X } from 'lucide-react'
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

type SortField = 'producer' | 'vintage' | 'quantity' | 'region'
type SortOrder = 'asc' | 'desc'

export default function CellarGrid() {
  const { data: wines = [], isLoading, error } = useQuery<Wine[]>({
    queryKey: ['wines'],
    queryFn: () => getWines(false), // Fetch all wines (including out of stock)
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
  const [showLocations, setShowLocations] = useState(false)

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
      result = result.filter(w => getTotalQuantity(w) > 0)
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
        comparison = getTotalQuantity(a) - getTotalQuantity(b)
      } else if (sortField === 'region') {
        const aR = a.region || ''
        const bR = b.region || ''
        comparison = aR.localeCompare(bR)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [wines, search, selectedStyle, selectedRegion, readyToDrinkOnly, inStockOnly, sortField, sortOrder, currentYear])

  // Get style style classes (Classic colors)
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
        return 'bg-orange-50 text-orange-800 border-orange-200'
      case 'dessert':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'fortified':
        return 'bg-red-55/10 text-red-800 border-red-200'
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200'
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
        classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        window: `${from}–${until || '?'}`
      }
    }

    if (until && currentYear > until) {
      return {
        label: 'Past Window',
        classes: 'bg-red-50 text-red-700 border-red-200',
        window: `${from || '?'}-${until}`
      }
    }

    return {
      label: 'Ready to Drink',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      window: `${from || '?'}-${until || '?'}`
    }
  }

  // Location data for Treemap
  const locationData = useMemo(() => {
    const inCellar = wines.filter(w => getTotalQuantity(w) > 0 && w.wine_stock?.some(s => s.cellar_location))
    if (inCellar.length === 0) return []
    
    const locationMap: Record<string, Record<string, number>> = {}
    
    inCellar.forEach(w => {
      w.wine_stock?.forEach(s => {
        if (s.quantity > 0) {
          const fullLoc = s.cellar_location || 'Unassigned'
          // Group by the main location prefix (e.g. "Wine Fridge, Row 6" -> "Wine Fridge")
          const loc = fullLoc.split(',')[0].trim()
          const style = w.style || 'Other'
          if (!locationMap[loc]) locationMap[loc] = {}
          if (!locationMap[loc][style]) locationMap[loc][style] = 0
          locationMap[loc][style] += s.quantity
        }
      })
    })

    const getStyleColor = (style: string) => {
      switch (style.toLowerCase()) {
        case 'red': return '#4A0E17' // burgundy
        case 'white': return '#C5A059' // gold
        case 'rose': return '#fb7185' // rose-400
        case 'sparkling': return '#fef08a' // yellow-200
        case 'dessert': return '#c084fc' // purple-400
        case 'orange': return '#fb923c' // orange-400
        case 'fortified': return '#9f1239' // rose-800
        default: return '#a8a29e' // stone-400
      }
    }

    return Object.entries(locationMap).map(([loc, styles]) => ({
      name: loc,
      children: Object.entries(styles).map(([style, count]) => ({
        name: style,
        locationName: loc,
        size: count,
        fill: getStyleColor(style)
      }))
    }))
  }, [wines])

  const TreemapContent = (props: any) => {
    const { depth, x, y, width, height, fill, name } = props
    
    if (depth === 2) {
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            stroke="#F9F6F0"
            strokeWidth={2}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
          {width > 45 && height > 30 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 4}
              textAnchor="middle"
              fill="#fff"
              fontSize={10}
              className="font-sans font-bold"
              style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.6)' }}
            >
              {name.substring(0, 8)}
            </text>
          )}
        </g>
      )
    }
    return null
  }

  const TreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-warm-border p-3 rounded-lg shadow-lg">
          <p className="font-serif font-bold text-charcoal">{data.locationName}</p>
          <p className="text-sm font-bold" style={{ color: data.fill }}>{data.name}</p>
          <p className="text-xs text-warm-muted">{data.size} bottles</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-cream max-w-5xl mx-auto w-full">
      {/* Search and Filters Bar */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-md border-b border-warm-border px-4 py-4 space-y-3">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-warm-muted" />
            <input
              type="text"
              placeholder="Search producer, grape, region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-warm-border rounded-lg pl-9 pr-4 py-2 text-sm text-charcoal placeholder-warm-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              showFilters || selectedRegion !== 'all' || readyToDrinkOnly || !inStockOnly
                ? 'bg-burgundy border-burgundy text-white shadow-sm'
                : 'bg-white border-warm-border text-charcoal hover:border-gold'
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
              className={`text-xs px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all capitalize font-serif font-bold cursor-pointer ${
                selectedStyle === style
                  ? 'bg-burgundy border-burgundy text-white shadow-sm'
                  : 'bg-white border-warm-border text-warm-muted hover:text-charcoal hover:border-gold/50'
              }`}
            >
              {style === 'all' ? 'All Styles' : style}
            </button>
          ))}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showFilters && (
          <div className="bg-white border border-warm-border rounded-xl p-4 space-y-3 shadow-md animate-slide-down">
            <div className="grid grid-cols-2 gap-4">
              {/* Region Selector */}
              <div>
                <label className="block text-[10px] font-bold text-warm-muted uppercase tracking-wider mb-1 font-sans">
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-cream border border-warm-border rounded-lg p-2 text-xs text-charcoal focus:outline-none focus:border-gold font-sans"
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
                <label className="block text-[10px] font-bold text-warm-muted uppercase tracking-wider mb-1 font-sans">
                  Inventory Status
                </label>
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    inStockOnly
                      ? 'bg-cream border-warm-border text-charcoal'
                      : 'bg-burgundy-light border-burgundy/30 text-burgundy font-bold'
                  }`}
                >
                  <span>{inStockOnly ? 'Currently In Cellar' : 'Include Empty'}</span>
                  <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-600' : 'bg-warm-muted'}`}></span>
                </button>
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => setReadyToDrinkOnly(!readyToDrinkOnly)}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  readyToDrinkOnly
                    ? 'bg-emerald-55/15 border-emerald-600 text-emerald-800 font-bold'
                    : 'bg-cream border-warm-border text-warm-muted hover:text-charcoal'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Ready to Drink ({currentYear})</span>
              </button>
            </div>
          </div>
        )}

        {/* Sort & Count row */}
        <div className="flex items-center justify-between text-xs text-warm-muted pt-1 border-t border-warm-border/55">
          <div className="flex items-center gap-3">
            <span>{filteredAndSortedWines.length} wines found</span>
            <button
              onClick={() => setShowLocations(!showLocations)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold transition-all cursor-pointer ${
                showLocations
                  ? 'bg-charcoal border-charcoal text-white'
                  : 'bg-cream border-warm-border text-charcoal hover:border-gold'
              }`}
            >
              {showLocations ? <X className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
              <span>Map</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-warm-muted uppercase font-semibold">Sort:</span>
            <button
              onClick={() => handleSort('producer')}
              className={`flex items-center gap-0.5 font-bold hover:text-charcoal cursor-pointer font-serif ${sortField === 'producer' ? 'text-burgundy' : ''}`}
            >
              Producer {sortField === 'producer' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('vintage')}
              className={`flex items-center gap-0.5 font-bold hover:text-charcoal cursor-pointer font-serif ${sortField === 'vintage' ? 'text-burgundy' : ''}`}
            >
              Vintage {sortField === 'vintage' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('quantity')}
              className={`flex items-center gap-0.5 font-bold hover:text-charcoal cursor-pointer font-serif ${sortField === 'quantity' ? 'text-burgundy' : ''}`}
            >
              Qty {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Location Treemap Drawer */}
      {showLocations && locationData.length > 0 && (
        <div className="bg-white border-b border-warm-border p-4 shadow-sm animate-slide-down shrink-0">
          <h3 className="font-serif font-bold text-charcoal mb-4 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-burgundy" />
            Bottle Distribution by Location
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={locationData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#F9F6F0"
                content={<TreemapContent />}
                animationDuration={600}
              >
                <RechartsTooltip content={<TreemapTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-[10px] uppercase font-bold text-warm-muted tracking-wider">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A0E17]"></span>Red</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>White</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span>Rosé</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-200"></span>Sparkling</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span>Dessert</div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-warm-border rounded-xl p-5 space-y-4 animate-pulse">
              <div className="h-4 bg-cream rounded w-2/3"></div>
              <div className="h-3 bg-cream rounded w-1/2"></div>
              <div className="flex justify-between items-center pt-2 border-t border-warm-border/30">
                <div className="h-5 bg-cream rounded w-1/4"></div>
                <div className="h-5 bg-cream rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-12 px-4">
            <Info className="h-8 w-8 text-burgundy mx-auto mb-2" />
            <p className="text-charcoal text-sm font-bold font-serif">Failed to load wine cellar</p>
            <p className="text-warm-muted text-xs mt-1">Please verify your connection and Supabase URL.</p>
          </div>
        ) : filteredAndSortedWines.length === 0 ? (
          <div className="text-center py-16 px-4">
            <WineIcon className="h-10 w-10 text-warm-border mx-auto mb-3" />
            <p className="text-charcoal text-sm font-bold font-serif">No wines found</p>
            <p className="text-warm-muted text-xs mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAndSortedWines.map((wine) => {
              const drinkStatus = getDrinkWindowStatus(wine)
              const qty = getTotalQuantity(wine)
              const locs = wine.wine_stock?.filter(s => s.quantity > 0 && s.cellar_location).map(s => s.cellar_location).join(', ')
              return (
                <Link
                  key={wine.id}
                  to={`/wine/${wine.id}`}
                  className="group relative bg-white hover:bg-white/95 border border-warm-border hover:border-gold hover:shadow-md transition-all rounded-xl p-5 flex flex-col justify-between cursor-pointer active:scale-[0.99] duration-150"
                >
                  {/* Out of stock badge */}
                  {qty === 0 && (
                    <div className="absolute top-0 right-0 bg-stone-100 border-b border-l border-warm-border text-[9px] uppercase font-bold text-warm-muted px-2.5 py-1 rounded-bl-lg rounded-tr-xl">
                      Empty
                    </div>
                  )}

                  <div className="space-y-1">
                    {/* Producer */}
                    <h3 className="text-charcoal font-serif font-bold text-lg leading-snug group-hover:text-burgundy transition-colors">
                      {wine.producer}
                    </h3>

                    {/* Name and Vintage */}
                    <div className="flex items-baseline gap-1.5">
                      {wine.name && (
                        <span className="text-warm-muted text-sm font-medium">
                          {wine.name}
                        </span>
                      )}
                      <span className="text-burgundy text-sm font-bold font-serif">
                        {wine.vintage || 'NV'}
                      </span>
                    </div>

                    {/* Appellation & Region */}
                    <div className="flex items-center gap-1.5 text-xs text-warm-muted pt-0.5 font-sans">
                      <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="truncate">
                        {wine.appellation || wine.region || 'Unknown Region'}
                        {wine.country && `, ${wine.country}`}
                      </span>
                    </div>
                  </div>

                  {/* Badges & Qty Row */}
                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-warm-border/50">
                    {/* Style & Drink window badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-bold tracking-wide uppercase ${getStyleBadgeClasses(wine.style)}`}>
                        {wine.style}
                      </span>
                      {drinkStatus && (
                        <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${drinkStatus.classes}`}>
                          {drinkStatus.label}
                        </span>
                      )}
                    </div>

                    {/* Qty & Location indicator */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-sm font-bold font-serif ${qty > 0 ? 'text-charcoal' : 'text-warm-muted'}`}>
                        {qty} {qty === 1 ? 'bottle' : 'bottles'}
                      </span>
                      {locs && (
                        <span className="text-[9px] text-warm-muted font-mono mt-0.5">
                          Loc: {locs}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
