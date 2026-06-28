import { supabase } from './supabaseClient'

export interface WineStock {
  id: string
  wine_id: string
  cellar_location: string | null
  quantity: number
  created_at: string
  updated_at: string
}

export interface Wine {
  id: string
  producer: string
  name: string | null
  vintage: number | null
  country: string | null
  region: string | null
  appellation: string | null
  varietals: string[]
  style: string // 'red' | 'white' | 'rose' | 'sparkling' | 'fortified' | 'dessert' | 'orange'
  classification: string | null
  alcohol_pct: number | null
  format: string
  wine_stock: WineStock[]
  purchase_date: string | null
  purchase_price: number | null
  purchase_source: string | null
  drink_from: number | null
  drink_until: number | null
  notes: string | null
  label_photo_url: string | null
  stephen_elo: number
  jennifer_elo: number
  created_at: string
  updated_at: string
}

export interface Tasting {
  id: string
  wine_id: string | null
  tasting_date: string
  occasion: string | null
  location: string | null
  cellar_location?: string | null
  companions: string | null
  food_pairing: string | null
  notes: string | null
  created_at: string
  wines?: Wine | null // Joined wine data
}

export interface Comparison {
  id: string
  wine_a_id: string
  wine_b_id: string
  stephen_winner: string | null // wine id, or null = tie / not expressed
  jennifer_winner: string | null
  comparison_date: string
  occasion: string | null
  notes: string | null
  created_at: string
  wine_a?: Wine | null
  wine_b?: Wine | null
}

/**
 * Fetch wines from the cellar.
 * By default, fetches active wines (quantity > 0) but can fetch all.
 */
export async function getWines(inCellarOnly = true): Promise<Wine[]> {
  if (inCellarOnly) {
    const { data, error } = await supabase
      .from('wines')
      .select('*, wine_stock!inner(*)')
      .gt('wine_stock.quantity', 0)
      .order('producer', { ascending: true })
      .order('vintage', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []) as Wine[]
  } else {
    const { data, error } = await supabase
      .from('wines')
      .select('*, wine_stock(*)')
      .order('producer', { ascending: true })
      .order('vintage', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []) as Wine[]
  }
}

/**
 * Fetch a single wine by ID.
 */
export async function getWineById(id: string): Promise<Wine | null> {
  const { data, error } = await supabase
    .from('wines')
    .select('*, wine_stock(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching wine ${id}:`, error)
    return null
  }

  return data as Wine
}

/**
 * Fetch all wines sorted by Elo ranking for a given person.
 * Returns all wines that have participated in at least one comparison
 * (i.e., elo !== 1500), plus any wines still at baseline.
 */
export async function getWineRankings(person: 'stephen' | 'jennifer'): Promise<Wine[]> {
  const eloCol = person === 'stephen' ? 'stephen_elo' : 'jennifer_elo'

  const { data, error } = await supabase
    .from('wines')
    .select('*, wine_stock(*)')
    .order(eloCol, { ascending: false })
    .order('producer', { ascending: true })

  if (error) {
    console.error(`Error fetching ${person} rankings:`, error)
    throw error
  }

  return (data || []) as Wine[]
}

/**
 * Fetch tasting history for a specific wine.
 */
export async function getTastingsForWine(wineId: string): Promise<Tasting[]> {
  const { data, error } = await supabase
    .from('tastings')
    .select('*')
    .eq('wine_id', wineId)
    .order('tasting_date', { ascending: false })

  if (error) {
    console.error(`Error fetching tastings for wine ${wineId}:`, error)
    throw error
  }

  return (data || []) as Tasting[]
}

/**
 * Fetch all tastings (recent first) with optional limit.
 * Joins wine information for context.
 */
export async function getRecentTastings(limit = 50): Promise<Tasting[]> {
  const { data, error } = await supabase
    .from('tastings')
    .select('*, wines(*, wine_stock(*))')
    .order('tasting_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent tastings:', error)
    throw error
  }

  return (data || []) as Tasting[]
}

/**
 * Fetch comparison history for a specific wine (either side of the matchup).
 */
export async function getComparisonsForWine(wineId: string): Promise<Comparison[]> {
  // Supabase doesn't support OR on foreign key joins natively,
  // so we fetch both sides and merge client-side.
  const [resA, resB] = await Promise.all([
    supabase
      .from('comparisons')
      .select('*, wine_a:wines!comparisons_wine_a_id_fkey(*, wine_stock(*)), wine_b:wines!comparisons_wine_b_id_fkey(*, wine_stock(*))')
      .eq('wine_a_id', wineId)
      .order('comparison_date', { ascending: false }),
    supabase
      .from('comparisons')
      .select('*, wine_a:wines!comparisons_wine_a_id_fkey(*, wine_stock(*)), wine_b:wines!comparisons_wine_b_id_fkey(*, wine_stock(*))')
      .eq('wine_b_id', wineId)
      .order('comparison_date', { ascending: false }),
  ])

  if (resA.error) console.error('Error fetching comparisons (a):', resA.error)
  if (resB.error) console.error('Error fetching comparisons (b):', resB.error)

  const combined = [...(resA.data || []), ...(resB.data || [])]
  combined.sort((a, b) => new Date(b.comparison_date).getTime() - new Date(a.comparison_date).getTime())
  return combined as Comparison[]
}

/**
 * Fetch recent comparisons (for the Stats dashboard).
 */
export async function getRecentComparisons(limit = 30): Promise<Comparison[]> {
  const { data, error } = await supabase
    .from('comparisons')
    .select('*, wine_a:wines!comparisons_wine_a_id_fkey(*, wine_stock(*)), wine_b:wines!comparisons_wine_b_id_fkey(*, wine_stock(*))')
    .order('comparison_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent comparisons:', error)
    throw error
  }

  return (data || []) as Comparison[]
}

/**
 * Insert a new tasting note.
 */
export async function insertTasting(tasting: Partial<Tasting>): Promise<Tasting> {
  const { data, error } = await supabase
    .from('tastings')
    .insert([tasting])
    .select()
    .single()

  if (error) {
    console.error('Error inserting tasting:', error)
    throw error
  }

  return data as Tasting
}

/**
 * Helper to calculate total bottles for a wine across all locations.
 */
export function getTotalQuantity(wine: Wine): number {
  if (!wine.wine_stock) return 0
  return wine.wine_stock.reduce((sum, stock) => sum + stock.quantity, 0)
}
