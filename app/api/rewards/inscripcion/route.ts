import { NextRequest, NextResponse } from 'next/server'
import { requireCliente } from '@/lib/cliente-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { permitirClave, hashClave } from '@/lib/limites'
import {
  REWARDS_VISIBLE, COMO_SE_ENTERO, type ComoSeEntero,
  crearMiembro, miembroPorUsuario, normalizarTelefono, saldoDe,
} from '@/lib/rewards'
import { enviarBienvenidaRewards } from '@/lib/correo-rewards'

const texto = (v: unknown, max = 100) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const error = (mensaje: string, status = 400) => NextResponse.json({ error: mensaje }, { status })

// POST — inscripción a Vitalora Rewards del cliente de la sesión.
// Cuerpo: { telefono, comoSeEntero, mayorEdad: true, aceptaTerminos: true, nombre?, apellido? }
// nombre/apellido solo se usan si faltan en perfiles (y ahí se guardan).
export async function POST(req: NextRequest) {
  if (!REWARDS_VISIBLE) return error('No encontrado', 404)

  const auth = await requireCliente(req)
  if (!auth.ok) return auth.response
  const { id: userId, email } = auth.cliente

  if (!(await permitirClave(`rewards-inscripcion:${hashClave(userId)}`, 5, 10))) {
    return error('Hiciste demasiados intentos. Espera un momento y vuelve a intentarlo.', 429)
  }

  const body = await req.json().catch(() => ({}))
  if (body?.mayorEdad !== true) return error('Para unirte necesitas confirmar que eres mayor de 18 años.')
  if (body?.aceptaTerminos !== true) return error('Para unirte necesitas aceptar los términos de Vitalora Rewards.')
  const telefono = normalizarTelefono(body?.telefono)
  if (!telefono) return error('Escribe tu teléfono a 10 dígitos.')
  const comoSeEntero = body?.comoSeEntero as ComoSeEntero
  if (!COMO_SE_ENTERO.includes(comoSeEntero)) return error('Cuéntanos cómo te enteraste de Vitalora Rewards.')

  if (await miembroPorUsuario(userId)) return error('Ya eres parte de Vitalora Rewards.', 409)

  const db = createServiceClient()
  const { data: perfil, error: errPerfil } = await db
    .from('perfiles').select('nombre, apellido, telefono').eq('id', userId).maybeSingle()
  if (errPerfil) {
    console.error('Error leyendo perfil para Rewards:', errPerfil)
    return error('No pudimos completar tu inscripción. Intenta de nuevo.', 500)
  }

  const nombre = texto(perfil?.nombre) || texto(body?.nombre)
  const apellido = texto(perfil?.apellido) || texto(body?.apellido)
  if (!nombre || !apellido) return error('Escribe tu nombre y apellido.')

  const resultado = await crearMiembro({ userId, nombre, apellido, telefono, comoSeEntero })
  if (!resultado.ok) {
    switch (resultado.error) {
      case 'YA_ES_MIEMBRO': return error('Ya eres parte de Vitalora Rewards.', 409)
      case 'TELEFONO_USADO': return error('Este teléfono ya está registrado en Vitalora Rewards.', 409)
      case 'DATOS_INVALIDOS': return error('Revisa tus datos e intenta de nuevo.')
      default: return error('No pudimos completar tu inscripción. Intenta de nuevo.', 500)
    }
  }

  // Completar el perfil solo donde estaba vacío
  const cambios: Record<string, string> = {}
  if (!texto(perfil?.nombre)) cambios.nombre = nombre
  if (!texto(perfil?.apellido)) cambios.apellido = apellido
  if (!texto(perfil?.telefono)) cambios.telefono = telefono
  if (Object.keys(cambios).length) {
    const { error: errCambios } = await db.from('perfiles').update(cambios).eq('id', userId)
    if (errCambios) console.error('Error completando perfil desde Rewards:', errCambios)
  }

  // Si el correo falla, la inscripción sigue siendo válida
  await enviarBienvenidaRewards({ email, nombre, codigo: resultado.miembro.codigo })

  const saldo = await saldoDe(resultado.miembro.id).catch(() => ({ disponibles: 0, pendientes: 0 }))
  return NextResponse.json({
    miembro: { codigo: resultado.miembro.codigo, estado: resultado.miembro.estado },
    saldo,
  })
}
