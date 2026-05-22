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
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  agregarItem: (item: Omit<CartItem, 'cantidad'>) => void
  quitarItem: (id: number) => void
  actualizarCantidad: (id: number, cantidad: number) => void
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
        const existe = items.find(i => i.id === item.id)
        if (existe) {
          set({
            items: items.map(i =>
              i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
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

      quitarItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) })
      },

      actualizarCantidad: (id, cantidad) => {
        if (cantidad < 1) {
          get().quitarItem(id)
          return
        }
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, cantidad } : i
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