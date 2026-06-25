// ============================================================
// Permisos del admin por rol.
// Define que secciones (por su href) puede ver cada rol.
// ============================================================

export type RolAdmin = 'dueno' | 'gerente' | 'editor' | 'ventas'

// Lista de todas las secciones del admin (por href)
export const TODAS_SECCIONES = [
  '/admin',                      // Dashboard
  '/admin/pedidos',
  '/admin/transferencias',
  '/admin/facturas',
  '/admin/inventario',
  '/admin/productos',
  '/admin/ritual',
  '/admin/resenas',
  '/admin/codigos',              // Cupones
  '/admin/influencers',
  '/admin/influencer-pagos',     // Pagos
  '/admin/cambios-fiscales',
  '/admin/clientes',
  '/admin/reportes',
  '/admin/lora',
  '/admin/usuarios',             // Gestion de usuarios (solo dueno) - se crea en etapa 4
]

// Que puede ver cada rol
export const PERMISOS: Record<RolAdmin, string[]> = {
  // Dueño: TODO
  dueno: TODAS_SECCIONES,

  // Gerente: todo menos gestion de usuarios
  gerente: [
    '/admin',
    '/admin/pedidos',
  '/admin/transferencias',
    '/admin/facturas',
    '/admin/inventario',
    '/admin/productos',
    '/admin/ritual',
    '/admin/resenas',
    '/admin/codigos',
    '/admin/influencers',
    '/admin/influencer-pagos',
    '/admin/cambios-fiscales',
    '/admin/clientes',
    '/admin/reportes',
    '/admin/lora',
  ],

  // Editor: catalogo y contenido
  editor: [
    '/admin',
    '/admin/inventario',
    '/admin/productos',
    '/admin/ritual',
    '/admin/resenas',
    '/admin/lora',
  ],

  // Ventas: operacion de pedidos + inventario
  ventas: [
    '/admin',
    '/admin/pedidos',
  '/admin/transferencias',
    '/admin/facturas',
    '/admin/inventario',
    '/admin/clientes',
  ],
}

// Etiqueta bonita de cada rol (para mostrar en la UI)
export const ROL_LABEL: Record<RolAdmin, string> = {
  dueno: 'Dueño',
  gerente: 'Gerente',
  editor: 'Editor',
  ventas: 'Ventas',
}

// Helper: un rol puede ver una ruta?
export function puedeVer(rol: RolAdmin, href: string): boolean {
  const permitidas = PERMISOS[rol]
  if (!permitidas) return false
  // El dashboard se compara exacto; las demas por prefijo
  if (href === '/admin') return permitidas.includes('/admin')
  return permitidas.some(p => p !== '/admin' && href.startsWith(p))
}
