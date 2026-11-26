'use client'

// El pedido ya existe y se confirmará cuando Mercado Pago acredite el pago:
// se vacían carrito, pedido pendiente y borrador (igual que /gracias) para
// evitar que el cliente compre dos veces.
import { useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { borrarPedidoPendiente } from '@/lib/pedido-pendiente'
import { borrarBorradorCheckout } from '@/lib/checkout-borrador'

export default function LimpiarCompra() {
  const { vaciarCarrito } = useCartStore()
  useEffect(() => {
    vaciarCarrito()
    borrarPedidoPendiente()
    borrarBorradorCheckout()
  }, [vaciarCarrito])
  return null
}
