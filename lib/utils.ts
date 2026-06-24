import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatea el id entero de un pedido como numero profesional: VIT-10002
// El id real en la base de datos no cambia; esto es solo para mostrar.
export function formatearNumeroPedido(id: number | string | null | undefined): string {
  const n = typeof id === 'string' ? parseInt(id, 10) : id
  if (!n || isNaN(n)) return 'VIT-00000'
  return 'VIT-' + (10000 + n)
}
