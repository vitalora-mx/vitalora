// ============================================================
// DICCIONARIO DE SINONIMOS (tienda y admin)
// Cada grupo son palabras que significan lo mismo. Si se busca una,
// tambien se busca por las demas del grupo.
// Para agregar mas: solo agrega un nuevo array a la lista
// (en minusculas y sin acentos).
// ============================================================
export const GRUPOS_SINONIMOS: string[][] = [
  // --- INGREDIENTES (los nombres de producto están en inglés) ---
  ['acido', 'acidos', 'acid'],

  // --- COSMETICOS (por categoria) ---
  ['serum', 'suero', 'esencia', 'ampolla', 'ampoule', 'essence', 'concentrado'],
  ['crema', 'cream', 'humectante', 'hidratante', 'moisturizer', 'balsamo', 'balm', 'manteca', 'gel hidratante', 'crema facial', 'crema hidratante'],
  ['limpiador', 'limpiadora', 'cleanser', 'jabon facial', 'gel limpiador', 'desmaquillante', 'exfoliante', 'peeling', 'scrub', 'agua micelar', 'espuma limpiadora', 'doble limpieza'],
  ['tonico', 'toner', 'mist', 'bruma', 'esencia facial', 'agua facial', 'locion'],
  ['protector solar', 'bloqueador', 'sunscreen', 'spf', 'fotoprotector', 'filtro solar', 'proteccion solar', 'bloqueador solar'],
  ['contorno de ojos', 'crema de ojos', 'eye cream', 'parches de ojos', 'contorno', 'ojeras', 'bolsas'],
  ['mascarilla', 'mascara facial', 'mask', 'parche', 'sheet mask', 'mascarilla coreana', 'mascarilla hidratante', 'mascarilla de tela'],
  ['parches para acne', 'parches', 'pimple patch', 'parche granos', 'parche espinillas', 'acne', 'granos', 'espinillas', 'barros'],
  ['labial', 'labios', 'lip', 'balsamo labial', 'lip balm', 'brillo labial', 'gloss', 'tinta labial', 'lip tint', 'mascarilla labial'],
  ['maquillaje', 'makeup', 'make up', 'base', 'corrector', 'rubor', 'sombras', 'cushion', 'bb cream', 'cc cream'],
  ['cabello', 'pelo', 'capilar', 'shampoo', 'champu', 'acondicionador', 'tratamiento capilar', 'mascarilla capilar', 'aceite capilar', 'anticaspa'],
  ['dispositivo', 'device', 'masajeador', 'gua sha', 'rodillo', 'roller', 'herramienta facial', 'aparato'],
  ['corporal', 'cuerpo', 'body', 'crema corporal', 'locion corporal', 'exfoliante corporal', 'body lotion'],

  // --- SUPLEMENTOS (por categoria) ---
  ['vitaminas', 'vitamina', 'multivitaminico', 'vitamina c', 'vitamina d', 'vitamina b', 'complejo b', 'vitamin'],
  ['minerales', 'mineral', 'magnesio', 'zinc', 'hierro', 'calcio', 'potasio'],
  ['proteina', 'protein', 'whey', 'proteina en polvo', 'suero de leche', 'proteina vegana', 'isolate'],
  ['colageno', 'collagen', 'peptidos de colageno', 'colageno hidrolizado'],
  ['probioticos', 'probiotico', 'probiotic', 'flora intestinal', 'bacterias buenas', 'lactobacilos'],
  ['omega 3', 'omega', 'aceite de pescado', 'fish oil', 'dha', 'epa', 'acidos grasos'],
  ['antioxidantes', 'antioxidante', 'antioxidant', 'resveratrol', 'coenzima q10', 'glutation'],
  ['energia', 'energetico', 'energy', 'pre entreno', 'cafeina', 'vitalidad', 'fatiga', 'cansancio'],
  ['biotina', 'biotin', 'unas', 'belleza desde adentro'],
  ['digestion', 'digestivo', 'fibra', 'enzimas digestivas', 'inflamacion', 'colon', 'estomago'],

  // --- POR BENEFICIO (cruzan categorias) ---
  ['arrugas', 'antiedad', 'antiarrugas', 'antiaging', 'lineas de expresion', 'firmeza'],
  ['manchas', 'despigmentante', 'aclarante', 'iluminador', 'tono disparejo', 'hiperpigmentacion'],
  ['acne', 'granos', 'espinillas', 'barros', 'puntos negros', 'poros'],
  ['hidratacion', 'piel seca', 'resequedad'],
  ['piel grasa', 'control de grasa', 'sebo', 'brillo'],
  ['piel sensible', 'rojeces', 'irritacion'],
  ['ojeras', 'bolsas', 'ojos cansados'],
  ['caida del cabello', 'caspa', 'pelo danado'],
  ['sueno', 'dormir', 'insomnio', 'descanso', 'relajacion'],
  ['defensas', 'inmune', 'sistema inmunologico'],
  ['vitamina c', 'vitamin c', 'acido ascorbico'],
]

export const MAX_TERMINOS = 15 // por palabra, contando la palabra y sus sinónimos

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const GRUPOS_NORMALIZADOS = GRUPOS_SINONIMOS.map(g => g.map(sinAcentos))

// Dada una palabra (ya normalizada), devuelve sus alternativas: ella misma + sinónimos
export function expandirSinonimos(t: string): string[] {
  const terminos = new Set<string>([t])
  // Con menos de 3 letras no se expanden sinónimos ("ca" coincidía con casi todos los grupos)
  if (t.length < 3) return [t]
  for (const grupo of GRUPOS_NORMALIZADOS) {
    if (terminos.size >= MAX_TERMINOS) break
    const coincide = grupo.some(palabra => t.includes(palabra) || palabra.includes(t))
    if (coincide) {
      grupo.forEach(palabra => terminos.add(palabra))
    }
  }
  return Array.from(terminos).slice(0, MAX_TERMINOS)
}
