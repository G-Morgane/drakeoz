import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

export interface Day {
  date: string
  title: string | null
  intro: string | null
  started_at: string | null
}

export interface Link {
  id: string
  date: string
  url: string
  title: string
  source: string
  note: string | null
  kind: SourceKind
  section: string | null
  done_at: string | null
  position: number
  created_at: string
}

export interface DaySummary {
  date: string
  title: string | null
  count: number
}

export interface NewLink {
  date: string
  url: string
  title: string
  source: string
  note?: string | null
  kind: SourceKind
  section?: string | null
}

export type LinkPatch = Partial<Pick<Link, 'title' | 'note' | 'url' | 'source' | 'kind' | 'section' | 'done_at'>>
export type DayPatch = Partial<Pick<Day, 'title' | 'intro' | 'started_at'>>

export interface Store {
  listDays(month?: string): Promise<DaySummary[]>
  getDay(date: string): Promise<{ day: Day | null; links: Link[] }>
  upsertDay(date: string, patch: DayPatch): Promise<Day>
  addLink(input: NewLink): Promise<Link>
  updateLink(id: string, patch: LinkPatch): Promise<Link>
  deleteLink(id: string): Promise<void>
}

// --- Stockage fichier (dev) -------------------------------------------------

interface FileDb {
  days: Day[]
  links: Link[]
}

function fileStore(): Store {
  const storage = useStorage('data')
  const KEY = 'db.json'

  async function read(): Promise<FileDb> {
    const db = (await storage.getItem<FileDb>(KEY)) ?? { days: [], links: [] }
    for (const l of db.links) {
      l.kind ??= kindOf(l.url)
      l.section ??= null
      l.done_at ??= null
    }
    for (const d of db.days) d.started_at ??= null
    return db
  }
  async function write(db: FileDb) {
    await storage.setItem(KEY, db)
  }

  return {
    async listDays(month) {
      const db = await read()
      const dates = new Set<string>([...db.days.map(d => d.date), ...db.links.map(l => l.date)])
      return [...dates]
        .filter(d => !month || d.startsWith(month))
        .sort((a, b) => (a < b ? 1 : -1))
        .map(date => ({
          date,
          title: db.days.find(d => d.date === date)?.title ?? null,
          count: db.links.filter(l => l.date === date).length,
        }))
    },
    async getDay(date) {
      const db = await read()
      return {
        day: db.days.find(d => d.date === date) ?? null,
        links: db.links.filter(l => l.date === date).sort((a, b) => a.position - b.position),
      }
    },
    async upsertDay(date, patch) {
      const db = await read()
      let day = db.days.find(d => d.date === date)
      if (!day) {
        day = { date, title: null, intro: null, started_at: null }
        db.days.push(day)
      }
      Object.assign(day, patch)
      await write(db)
      return day
    },
    async addLink(input) {
      const db = await read()
      if (!db.days.some(d => d.date === input.date)) db.days.push({ date: input.date, title: null, intro: null, started_at: null })
      const position = db.links.filter(l => l.date === input.date).length
      const link: Link = {
        id: randomUUID(),
        date: input.date,
        url: input.url,
        title: input.title,
        source: input.source,
        note: input.note ?? null,
        kind: input.kind,
        section: input.section ?? null,
        done_at: null,
        position,
        created_at: new Date().toISOString(),
      }
      db.links.push(link)
      await write(db)
      return link
    },
    async updateLink(id, patch) {
      const db = await read()
      const link = db.links.find(l => l.id === id)
      if (!link) throw createError({ statusCode: 404, statusMessage: 'Lien introuvable' })
      Object.assign(link, patch)
      await write(db)
      return link
    },
    async deleteLink(id) {
      const db = await read()
      db.links = db.links.filter(l => l.id !== id)
      await write(db)
    },
  }
}

// --- Supabase (prod) --------------------------------------------------------

function supabaseStore(client: SupabaseClient): Store {
  function fail(error: { message: string } | null): asserts error is null {
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    async listDays(month) {
      let q = client.from('days').select('date, title, links(count)').order('date', { ascending: false })
      if (month) {
        q = q.gte('date', `${month}-01`).lt('date', nextMonthStart(month))
      }
      const { data, error } = await q
      fail(error)
      return (data ?? []).map((d: any) => ({
        date: d.date,
        title: d.title,
        count: d.links?.[0]?.count ?? 0,
      }))
    },
    async getDay(date) {
      const [{ data: day, error: e1 }, { data: links, error: e2 }] = await Promise.all([
        client.from('days').select('date, title, intro, started_at').eq('date', date).maybeSingle(),
        client.from('links').select('*').eq('date', date).order('position'),
      ])
      fail(e1)
      fail(e2)
      return { day: (day as Day | null) ?? null, links: (links as Link[]) ?? [] }
    },
    async upsertDay(date, patch) {
      const { data, error } = await client
        .from('days')
        .upsert({ date, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'date' })
        .select('date, title, intro, started_at')
        .single()
      fail(error)
      return data as Day
    },
    async addLink(input) {
      await client.from('days').upsert({ date: input.date }, { onConflict: 'date', ignoreDuplicates: true })
      const { count } = await client.from('links').select('*', { count: 'exact', head: true }).eq('date', input.date)
      const { data, error } = await client
        .from('links')
        .insert({ ...input, note: input.note ?? null, section: input.section ?? null, position: count ?? 0 })
        .select('*')
        .single()
      fail(error)
      return data as Link
    },
    async updateLink(id, patch) {
      const { data, error } = await client.from('links').update(patch).eq('id', id).select('*').single()
      fail(error)
      return data as Link
    },
    async deleteLink(id) {
      const { error } = await client.from('links').delete().eq('id', id)
      fail(error)
    },
  }
}

function nextMonthStart(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y!, m!, 1))
  return d.toISOString().slice(0, 10)
}

// --- Sélection --------------------------------------------------------------

let store: Store | undefined

export function useDb(): Store {
  if (store) return store
  const { supabaseUrl, supabaseServiceKey } = useRuntimeConfig()
  store = supabaseUrl && supabaseServiceKey
    ? supabaseStore(createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } }))
    : fileStore()
  return store
}
