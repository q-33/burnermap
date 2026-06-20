import type { CampDto, CampWithLocationDto } from '~~/types/camp'
import type { LocationDto } from '~~/types/location'

// Camps data layer, backed by Supabase. Reads are public (RLS); writes require
// an authenticated session and are owner-scoped by RLS (see supabase/schema.sql).
// Rows are aliased back into the existing DTO shape so the stores/map are unchanged.
const CAMP_SELECT
  = 'uid:id, name, year, description, website, url, contact_email, hometown, '
  + 'locations(string:address_string, gps_latitude, gps_longitude, createdAt:created_at)'

export function useCamps() {
  const supabase = useSupabase()

  const getAll = async (): Promise<CampWithLocationDto[]> => {
    const { data, error } = await supabase.from('camps').select(CAMP_SELECT)
    if (error) {
      window.console.error('[camps] getAll:', error.message)
      return []
    }
    return (data ?? []) as unknown as CampWithLocationDto[]
  }

  const getById = async (id: string) => {
    const { data, error } = await supabase.from('camps').select(CAMP_SELECT).eq('id', id).single()
    if (error)
      throw error
    return data
  }

  const create = async (payload: CampDto) => {
    const { data, error } = await supabase
      .from('camps')
      .insert({
        name: payload.name,
        year: payload.year,
        description: payload.description,
        website: payload.website,
        url: payload.url,
        contact_email: payload.contact_email,
        hometown: payload.hometown,
      })
      .select('uid:id, name, year')
      .single()
    if (error)
      throw error
    return data
  }

  const addLocationByCampId = async (campId: string, payload: Partial<LocationDto>) => {
    const { data, error } = await supabase
      .from('locations')
      .insert({
        camp_id: campId,
        address_string: payload.string,
        gps_latitude: payload.gps_latitude ?? null,
        gps_longitude: payload.gps_longitude ?? null,
      })
      .select()
      .single()
    if (error)
      throw error
    return data
  }

  const deleteById = async (id: string) => {
    const { error } = await supabase.from('camps').delete().eq('id', id)
    if (error)
      throw error
  }

  return { create, getAll, getById, addLocationByCampId, deleteById }
}
