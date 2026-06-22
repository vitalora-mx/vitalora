import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const TOPE_ALERTA = 5000
const ADMIN_EMAIL = 'gabomaciel7@gmail.com'

// Este endpoint lo llama el cron de Vercel una vez al día.
// Protegido con CRON_SECRET para que nadie más lo dispare.
export async function GET(request: Request) {
  // Verificar el secreto del cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const resumen = {
      nuevasAlertas: 0,
      correosDia15: 0,
      codigosPausados: 0,
      reiniciadas: 0,
    }

    // Traer todos los influencers aprobados o pausados (los rechazados no aplican)
    const { data: influencers } = await supabase
      .from('influencers')
      .select('id, nombre, email, codigo, estado, saldo_alerta_desde, alerta_dia15_enviado')
      .in('estado', ['aprobado', 'pausado'])

    if (!influencers || influencers.length === 0) {
      return NextResponse.json({ ok: true, mensaje: 'No hay influencers que revisar.', resumen })
    }

    // Traer todas las comisiones pendientes sin pago vinculado
    const { data: comisiones } = await supabase
      .from('influencer_comisiones')
      .select('influencer_id, monto_comision, estado, pago_id')
      .eq('estado', 'pendiente')
      .is('pago_id', null)

    const ahora = new Date()

    for (const inf of influencers) {
      // Calcular saldo disponible del influencer
      const suyas = (comisiones ?? []).filter(c => c.influencer_id === inf.id)
      const saldo = suyas.reduce((a, c) => a + (c.monto_comision ?? 0), 0)

      // ─── CASO 1: saldo bajó del tope → reiniciar alerta si la tenía ───
      if (saldo < TOPE_ALERTA) {
        if (inf.saldo_alerta_desde) {
          await supabase
            .from('influencers')
            .update({ saldo_alerta_desde: null, alerta_dia15_enviado: false })
            .eq('id', inf.id)
          resumen.reiniciadas++
        }
        continue
      }

      // ─── CASO 2: saldo >= tope ───
      // Si no tenía fecha de alerta, registrarla ahora (día 0)
      if (!inf.saldo_alerta_desde) {
        await supabase
          .from('influencers')
          .update({ saldo_alerta_desde: ahora.toISOString(), alerta_dia15_enviado: false })
          .eq('id', inf.id)
        resumen.nuevasAlertas++
        continue // recién empieza el conteo, no enviamos correo todavía
      }

      // Calcular días transcurridos desde que cruzó el tope
      const dias = Math.floor((ahora.getTime() - new Date(inf.saldo_alerta_desde).getTime()) / (1000 * 60 * 60 * 24))

      // ─── DÍA 30+: pausar el código ───
      if (dias >= 30) {
        // Solo pausar si aún está aprobado (no re-pausar)
        if (inf.estado === 'aprobado') {
          // Desactivar su código de descuento
          if (inf.codigo) {
            await supabase
              .from('codigos_descuento')
              .update({ activo: false })
              .eq('codigo', inf.codigo)
          }
          // Pausar al influencer
          await supabase
            .from('influencers')
            .update({ estado: 'pausado' })
            .eq('id', inf.id)

          // Correo de pausa a ambos
          await enviarCorreoPausa(inf, saldo)
          resumen.codigosPausados++
        }
        continue
      }

      // ─── DÍA 15-29: correo de aviso urgente (una sola vez, usando la bandera) ───
      if (dias >= 15 && !inf.alerta_dia15_enviado) {
        await enviarCorreoDia15(inf, saldo)
        await supabase
          .from('influencers')
          .update({ alerta_dia15_enviado: true })
          .eq('id', inf.id)
        resumen.correosDia15++
        continue
      }
    }

    return NextResponse.json({ ok: true, resumen })

  } catch (err) {
    console.error('Error en cron de escalación:', err)
    return NextResponse.json({ error: 'Error al procesar el cron' }, { status: 500 })
  }
}

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

async function enviarCorreoDia15(inf: any, saldo: number) {
  // Correo a la embajadora
  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: inf.email,
      subject: 'Acción requerida: solicita tu pago de comisiones — Vitalora',
      html: correoEmbajadora(inf.nombre, saldo, 'dia15'),
    })
  } catch (e) { console.error('Error correo día 15 embajadora:', e) }

  // Correo a admin
  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: ADMIN_EMAIL,
      subject: `Embajadora con saldo alto sin solicitar: ${inf.nombre}`,
      html: correoAdmin(inf, saldo, 'dia15'),
    })
  } catch (e) { console.error('Error correo día 15 admin:', e) }
}

async function enviarCorreoPausa(inf: any, saldo: number) {
  // Correo a la embajadora
  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: inf.email,
      subject: 'Tu código fue pausado temporalmente — Vitalora',
      html: correoEmbajadora(inf.nombre, saldo, 'pausa'),
    })
  } catch (e) { console.error('Error correo pausa embajadora:', e) }

  // Correo a admin
  try {
    await resend.emails.send({
      from: 'Vitalora <hola@vitalora.com.mx>',
      to: ADMIN_EMAIL,
      subject: `Código pausado automáticamente: ${inf.nombre}`,
      html: correoAdmin(inf, saldo, 'pausa'),
    })
  } catch (e) { console.error('Error correo pausa admin:', e) }
}

function correoEmbajadora(nombre: string, saldo: number, tipo: 'dia15' | 'pausa') {
  const esPausa = tipo === 'pausa'
  const titulo = esPausa ? 'Tu código fue pausado temporalmente' : 'Por favor solicita tu pago'
  const mensaje = esPausa
    ? `Tu saldo acumulado de <strong>${fmt(saldo)}</strong> lleva más de 30 días sin que solicites tu pago, por lo que tu código fue pausado temporalmente. Para reactivarlo, ingresa a tu portal, solicita tu pago y sube tu factura CFDI. En cuanto procesemos tu pago, tu código volverá a estar activo.`
    : `Tu saldo acumulado es de <strong>${fmt(saldo)}</strong> y lleva más de 15 días sin solicitarse. Para mantener todo al corriente fiscalmente, te pedimos que ingreses a tu portal, solicites tu pago y subas tu factura CFDI lo antes posible. Si pasan 30 días, tu código se pausará temporalmente.`

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">PROGRAMA DE EMBAJADORAS</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;color:#0E0E0E;margin:0 0 16px;">${titulo}</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">Hola ${nombre.split(' ')[0]},<br><br>${mensaje}</p>
    <div style="text-align:center;">
      <a href="https://vitalora.com.mx/influencer/portal" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600;">Ir a mi portal</a>
    </div>
  </div>
  <div style="background:#0E0E0E;padding:20px;text-align:center;">
    <p style="font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Vitalora · hola@vitalora.com.mx</p>
  </div>
</div></body></html>`
}

function correoAdmin(inf: any, saldo: number, tipo: 'dia15' | 'pausa') {
  const esPausa = tipo === 'pausa'
  const titulo = esPausa ? 'Código pausado automáticamente' : 'Embajadora con saldo alto'
  const mensaje = esPausa
    ? `El código de <strong>${inf.nombre}</strong> (${inf.email}) fue pausado automáticamente por acumular ${fmt(saldo)} durante más de 30 días sin solicitar pago. Se reactivará cuando solicite su pago y procese su factura.`
    : `<strong>${inf.nombre}</strong> (${inf.email}) tiene ${fmt(saldo)} acumulados sin solicitar desde hace más de 15 días. Se le envió un recordatorio. Si pasa a 30 días, su código se pausará automáticamente.`

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:white;">
  <div style="background:#0E0E0E;padding:24px;text-align:center;">
    <img src="https://vitalora.com.mx/images/logo/logo-footer.png" alt="Vitalora" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
    <div style="font-size:10px;letter-spacing:0.3em;color:#C9A961;margin-top:4px;">${esPausa ? 'CÓDIGO PAUSADO' : 'SALDO ALTO'}</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;color:#0E0E0E;margin:0 0 16px;">${titulo}</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">${mensaje}</p>
    <div style="text-align:center;">
      <a href="https://vitalora.com.mx/admin/influencer-pagos" style="display:inline-block;background:#0E0E0E;color:#C9A961;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600;">Ver en el admin</a>
    </div>
  </div>
</div></body></html>`
}
