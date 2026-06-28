import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, MapPin, Users, Utensils, Wine as WineIcon, FileText } from 'lucide-react'
import { getWines, insertTasting, type Wine } from '../lib/queries'

interface AddTastingModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedWineId?: string
}

export default function AddTastingModal({ isOpen, onClose, preselectedWineId }: AddTastingModalProps) {
  const queryClient = useQueryClient()

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [wineId, setWineId] = useState(preselectedWineId || '')
  const [cellarLocation, setCellarLocation] = useState('')
  const [occasion, setOccasion] = useState('')
  const [location, setLocation] = useState('')
  const [companions, setCompanions] = useState('')
  const [foodPairing, setFoodPairing] = useState('')
  const [notes, setNotes] = useState('')

  // Reset form when opened with a new preselection
  useEffect(() => {
    if (isOpen) {
      if (preselectedWineId) {
        setWineId(preselectedWineId)
      }
      setCellarLocation('')
      setDate(new Date().toISOString().split('T')[0])
      setOccasion('')
      setLocation('')
      setCompanions('')
      setFoodPairing('')
      setNotes('')
    }
  }, [isOpen, preselectedWineId])

  // Fetch wines for dropdown if no preselected wine or if we just want the list
  const { data: wines = [], isLoading: loadingWines } = useQuery<Wine[]>({
    queryKey: ['wines-tasting-form'],
    queryFn: () => getWines(true), // Only wines in cellar
  })

  const mutation = useMutation({
    mutationFn: insertTasting,
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['recent-tastings'] })
      queryClient.invalidateQueries({ queryKey: ['recent-tastings-dashboard'] })
      if (wineId) {
        queryClient.invalidateQueries({ queryKey: ['tastings', wineId] })
      }
      onClose()
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wineId) return

    mutation.mutate({
      wine_id: wineId,
      tasting_date: date,
      cellar_location: cellarLocation || null,
      occasion: occasion || null,
      location: location || null,
      companions: companions || null,
      food_pairing: foodPairing || null,
      notes: notes || null,
    })
  }

  const selectedWine = wines.find(w => w.id === wineId)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-cream rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full border border-warm-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-border bg-white shrink-0">
          <h2 className="font-serif font-bold text-burgundy text-lg flex items-center gap-2">
            <WineIcon className="h-5 w-5" />
            Log Tasting Note
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-warm-border/40 text-warm-muted hover:text-charcoal transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form id="tasting-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Wine Selection */}
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans">
                Wine <span className="text-red-500">*</span>
              </label>
              {preselectedWineId && selectedWine ? (
                <div className="bg-white border border-warm-border rounded-lg p-3 text-sm font-serif font-bold text-charcoal">
                  {selectedWine.producer} {selectedWine.vintage || 'NV'} {selectedWine.name ? `· ${selectedWine.name}` : ''}
                </div>
              ) : (
                <div className="relative">
                  <select
                    required
                    value={wineId}
                    onChange={(e) => setWineId(e.target.value)}
                    className="w-full bg-white border border-warm-border rounded-lg px-3 py-2.5 text-sm font-serif text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold appearance-none disabled:opacity-50"
                    disabled={loadingWines}
                  >
                    <option value="" disabled>Select a wine from your cellar...</option>
                    {wines.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.producer} {w.vintage || 'NV'} {w.name ? `· ${w.name}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-warm-muted">
                    <WineIcon className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>

            {/* Cellar Location Source */}
            {selectedWine && selectedWine.wine_stock && selectedWine.wine_stock.some(s => s.quantity > 0 && s.cellar_location) && (
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans flex items-center justify-between">
                  <span>Source Location</span>
                  <span className="text-[10px] text-warm-muted font-normal normal-case">Optional</span>
                </label>
                <div className="relative">
                  <select
                    value={cellarLocation}
                    onChange={(e) => setCellarLocation(e.target.value)}
                    className="w-full bg-white border border-warm-border rounded-lg px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold appearance-none"
                  >
                    <option value="">Any location (auto-select)</option>
                    {selectedWine.wine_stock
                      .filter(s => s.quantity > 0 && s.cellar_location)
                      .map(s => (
                        <option key={s.id} value={s.cellar_location!}>
                          {s.cellar_location} ({s.quantity} {s.quantity === 1 ? 'btl' : 'btls'} available)
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-warm-muted">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans">
                Tasting Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-warm-border rounded-lg px-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold appearance-none"
                />
              </div>
            </div>

            {/* Context Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans">
                  Occasion
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g. Anniversary, Dinner..."
                    className="w-full bg-white border border-warm-border rounded-lg pl-9 pr-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold placeholder:text-warm-muted/60"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-warm-muted" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Home, Restaurant..."
                    className="w-full bg-white border border-warm-border rounded-lg pl-9 pr-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold placeholder:text-warm-muted/60"
                  />
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-warm-muted" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans">
                  Companions
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={companions}
                    onChange={(e) => setCompanions(e.target.value)}
                    placeholder="e.g. John & Jane"
                    className="w-full bg-white border border-warm-border rounded-lg pl-9 pr-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold placeholder:text-warm-muted/60"
                  />
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-warm-muted" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans">
                  Food Pairing
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={foodPairing}
                    onChange={(e) => setFoodPairing(e.target.value)}
                    placeholder="e.g. Roast chicken"
                    className="w-full bg-white border border-warm-border rounded-lg pl-9 pr-3 py-2 text-sm font-sans text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold placeholder:text-warm-muted/60"
                  />
                  <Utensils className="absolute left-3 top-2.5 h-4 w-4 text-warm-muted" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5 font-sans flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Tasting Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Aromas, palate, finish, overall impressions..."
                className="w-full bg-white border border-warm-border rounded-lg p-3 text-sm font-serif text-charcoal focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold placeholder:text-warm-muted/60 placeholder:font-sans resize-none"
              />
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-warm-border bg-white flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold font-sans text-charcoal hover:bg-warm-border/30 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="tasting-form"
            disabled={mutation.isPending || !wineId}
            className="px-6 py-2 rounded-lg text-sm font-bold font-sans bg-burgundy text-white hover:bg-burgundy-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
          >
            {mutation.isPending ? 'Saving...' : 'Save Tasting'}
          </button>
        </div>
      </div>
    </div>
  )
}
