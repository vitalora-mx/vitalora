import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: number
  slug: string
  nombre: string
  marca: string
  precio: number
  cantidad: number
  imagen: string
  tipo: 'cosmetico' | 'suplemento'
  // Campos opcionales de variante (si el producto se compró como variante)
  varianteId?: number | null
  varianteNombre?: string | null
}

// Identidad unica de una linea del carrito: producto + variante (si tiene)
function claveItem(id: number, varianteId?: number | null): string {
  return `${id}__${varianteId ?? 'base'}`
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  agregarItem: (item: Omit<CartItem, 'cantidad'>) => void
  quitarItem: (id: number, varianteId?: number | null) => void
  actualizarCantidad: (id: number, cantidad: number, varianteId?: number | null) => void
  vaciarCarrito: () => void
  abrirCarrito: () => void
  cerrarCarrito: () => void
  total: () => number
  totalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      agregarItem: (item) => {
        const items = get().items
        const clave = claveItem(item.id, item.varianteId)
        const existe = items.find(i => claveItem(i.id, i.varianteId) === clave)
        if (existe) {
          set({
            items: items.map(i =>
              claveItem(i.id, i.varianteId) === clave ? { ...i, cantidad: i.cantidad + 1 } : i
            ),
            isOpen: true,
          })
        } else {
          set({
            items: [...items, { ...item, cantidad: 1 }],
            isOpen: true,
          })
        }
      },
      quitarItem: (id, varianteId) => {
        const clave = claveItem(id, varianteId)
        set({ items: get().items.filter(i => claveItem(i.id, i.varianteId) !== clave) })
      },
      actualizarCantidad: (id, cantidad, varianteId) => {
        if (cantidad < 1) {
          get().quitarItem(id, varianteId)
          return
        }
        const clave = claveItem(id, varianteId)
        set({
          items: get().items.map(i =>
            claveItem(i.id, i.varianteId) === clave ? { ...i, cantidad } : i
          ),
        })
      },
      vaciarCarrito: () => set({ items: [] }),
      abrirCarrito: () => set({ isOpen: true }),
      cerrarCarrito: () => set({ isOpen: false }),
      total: () => get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
    }),
    { name: 'vitalora-carrito' }
  )
)
