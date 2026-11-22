import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req, "/admin/clientes")
  if (!adminAuth.ok) return adminAuth.response

  try {
    // Obtener perfiles de usuarios registrados
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id, nombre, apellido, created_at')
      .order('created_at', { ascending: false })

    if (perfilesError) throw perfilesError

    // perfiles no tiene email: se toma de Supabase Auth (paginado)
    const emailPorId: Record<string, string> = {}
    const POR_PAGINA = 1000
    for (let page = 1; page <= 50; page++) {
      const { data: lista, error: authError } = await supabase.auth.admin.listUsers({ page, perPage: POR_PAGINA })
      if (authError) throw authError
      for (const u of lista.users) if (u.email) emailPorId[u.id] = u.email
      if (lista.users.length < POR_PAGINA) break
    }

    // Para cada perfil, obtener sus pedidos
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, user_id, total, created_at, estado')
      .in('estado', ['pagado', 'preparando', 'enviado', 'entregado'])

    if (pedidosError) throw pedidosError

    // Construir mapa de pedidos por user_id
    const pedidosPorUser: Record<string, { count: number; total: number; ultima: string }> = {}
    for (const p of pedidos ?? []) {
      if (!p.user_id) continue
      if (!pedidosPorUser[p.user_id]) {
        pedidosPorUser[p.user_id] = { count: 0, total: 0, ultima: p.created_at }
      }
      pedidosPorUser[p.user_id].count++
      pedidosPorUser[p.user_id].total += Number(p.total ?? 0)
      if (p.created_at > pedidosPorUser[p.user_id].ultima) {
        pedidosPorUser[p.user_id].ultima = p.created_at
      }
    }

    // Combinar perfiles con sus pedidos
    const clientes = (perfiles ?? []).map(p => {
      const datos = pedidosPorUser[p.id] ?? { count: 0, total: 0, ultima: null }
      return {
        id: p.id,
        nombre: [p.nombre, p.apellido].filter(Boolean).join(' ') || 'Sin nombre',
        email: emailPorId[p.id] ?? null,
        created_at: p.created_at,
        compras: datos.count,
        total: datos.total,
        ultima_compra: datos.ultima,
        tipo: datos.count >= 2 ? 'recurrente' : 'nuevo',
      }
    })

    // Stats
    const totalRegistrados = clientes.length
    const recurrentes = clientes.filter(c => c.compras >= 2).length
    const conCompras = clientes.filter(c => c.compras > 0).length
    const totalVentas = clientes.reduce((a, c) => a + c.total, 0)
    const valorPromedio = conCompras > 0 ? totalVentas / conCompras : 0

    // Mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const nuevosEsteMes = clientes.filter(c => new Date(c.created_at) >= inicioMes).length

    return NextResponse.json({
      clientes,
      stats: {
        total: totalRegistrados,
        nuevosEsteMes,
        recurrentes,
        valorPromedio,
      }
    })
  } catch (err) {
    console.error('Error clientes GET:', err)
    return NextResponse.json({ error: 'Error al cargar clientes' }, { status: 500 })
  }
}
