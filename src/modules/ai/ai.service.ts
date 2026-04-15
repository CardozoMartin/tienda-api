import Groq from 'groq-sdk';

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no está configurado en el servidor.');
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// ─────────────────────────────────────────────────────────────────────────────
// LÍMITES DUROS POR RED SOCIAL
// El objetivo es SIEMPRE llevar al usuario a la web. Copy corto = más clics.
// ─────────────────────────────────────────────────────────────────────────────

const RED_SOCIAL_CONFIG: Record<
  string,
  {
    lineasMaxCuerpo: number; // líneas máximas del cuerpo (sin contar hook ni CTA)
    hashtagCount: number;
    instruccion: string;
  }
> = {
  instagram: {
    lineasMaxCuerpo: 3,
    hashtagCount: 15,
    instruccion: `
FORMATO INSTAGRAM — máximo 6 líneas de texto visible (antes del "ver más"):
Línea 1: Hook. Una frase. Para el scroll. Sin presentar el producto todavía.
[blanco]
Líneas 2-4: Máximo 3 líneas. Producto + 1 beneficio clave + precio. Sin desarrollo.
[blanco]
Línea 5: CTA. Una acción. "Link en bio 👆" o "DM para más info".
[blanco]
Hashtags: bloque al final.`,
  },

  facebook: {
    lineasMaxCuerpo: 3,
    hashtagCount: 4,
    instruccion: `
FORMATO FACEBOOK — máximo 4 líneas en total:
Línea 1: Hook directo o precio que detiene el scroll.
Líneas 2-3: Producto + beneficio principal. Sin rodeos.
Línea 4: CTA con instrucción específica. "Hacé click en el link", "Escribinos al chat".
Máximo 4 hashtags al final.`,
  },

  tiktok: {
    lineasMaxCuerpo: 2,
    hashtagCount: 6,
    instruccion: `
FORMATO TIKTOK — máximo 3 líneas + hashtags:
Línea 1: Hook ultra corto. "POV:", pregunta directa, o dato que sorprenda.
Líneas 2-3: Producto + precio. Frases de 5 palabras máximo.
Hashtags trending + nicho. Máximo 6.`,
  },

  twitter: {
    lineasMaxCuerpo: 2,
    hashtagCount: 2,
    instruccion: `
FORMATO TWITTER — un solo bloque, máximo 240 caracteres:
Hook + producto + precio + CTA. Todo en un párrafo cortísimo.
Máximo 2 hashtags incluidos dentro del límite de caracteres.`,
  },

  whatsapp: {
    lineasMaxCuerpo: 3,
    hashtagCount: 0,
    instruccion: `
FORMATO WHATSAPP — máximo 5 líneas, sin hashtags:
Línea 1: Dato o precio que llama la atención de inmediato.
Líneas 2-3: Producto + 1 beneficio + urgencia real y específica.
Línea 4: CTA conversacional. "Respondé este mensaje" o "Mandame 'quiero verlo'".
Sin hashtags. Sin formalidad. Como un mensaje de alguien que te pasa un dato.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS PROBADOS POR TONO
// Son la primera línea real del post. Lo que para el scroll.
// El modelo elige el más adecuado al producto y lo adapta — no lo copia.
// ─────────────────────────────────────────────────────────────────────────────

const HOOKS_POR_TONO: Record<string, string> = {
  urgente: `
HOOKS DE REFERENCIA (tono urgente) — elegí el patrón más adecuado al producto:
- "Quedan [N] unidades. El precio sube el [día]."
- "$[precio normal] → $[precio oferta]. Solo hasta el [día]."
- "Si lo viste antes, ahora está más barato."
- "[Producto] + envío gratis. Solo esta semana."
→ El hook urgente siempre tiene un dato concreto. Sin dato, no hay urgencia real.`,

  divertido: `
HOOKS DE REFERENCIA (tono divertido) — elegí el patrón más adecuado al producto:
- "Sí, lo necesitás. No, no es negociable."
- "Tu [situación actual sin el producto] tiene solución."
- "[Cosa graciosa que todos reconocen] tiene nombre: [producto]."
- "Para los que decían 'no lo necesito' 👀"
→ El hook divertido se ríe de algo que el comprador reconoce. Sin atacarlo.`,

  profesional: `
HOOKS DE REFERENCIA (tono profesional) — elegí el patrón más adecuado al producto:
- "[Beneficio clave]. Sin vueltas."
- "El [categoría] que usan los que saben."
- "$[precio]. [Beneficio principal]. [Compatibilidad]."
- "[Feature técnica] a $[precio]. Disponible ahora."
→ El hook profesional es un dato de valor. Directo, sin adornos.`,

  emocional: `
HOOKS DE REFERENCIA (tono emocional) — elegí el patrón más adecuado al producto:
- "Hay cosas que cambian cómo vivís [actividad]. Esto es una de ellas."
- "Cuando lo probés, no vas a querer volver a lo anterior."
- "No es solo [producto]. Es [experiencia que da]."
→ El hook emocional apunta al deseo, no al producto. Breve, sin desarrollar.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// AI SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class AiService {
  async generateSocialMediaPost(producto: any, redSocial: string, tono: string): Promise<string> {
    const groqClient = getGroqClient();
    const { nombre, descripcion, precio, precioOferta, categoria, marca } = producto;

    const redKey = redSocial.toLowerCase();
    const tonoKey = tono.toLowerCase();
    const config = RED_SOCIAL_CONFIG[redKey] ?? RED_SOCIAL_CONFIG.instagram;
    const hooks = HOOKS_POR_TONO[tonoKey] ?? HOOKS_POR_TONO.divertido;

    const tieneOferta = precioOferta && Number(precioOferta) < Number(precio);
    const descuento = tieneOferta
      ? `${Math.round(((precio - precioOferta) / precio) * 100)}%`
      : null;

    // ── System prompt ─────────────────────────────────────────────────────────
    const systemPrompt = `Sos un copywriter especializado en ventas para tiendas online argentinas. Tu único objetivo es escribir copy CORTO que haga que alguien deje de scrollear y entre a la web a ver el producto.

NO sos un narrador. NO contás historias. NO describís el producto en detalle.
Escribís la mínima cantidad de palabras necesarias para generar el máximo deseo de hacer clic.

════════════════════════════════════
MENTALIDAD: MENOS ES MÁS
════════════════════════════════════
El copy de venta que convierte en redes no informa — INTERRUMPE.
El lector no quiere leer. Quiere ver algo que lo haga pensar "eso lo quiero" en 3 segundos.
Tu trabajo es esos 3 segundos. El resto lo hace la página web.

════════════════════════════════════
PROHIBICIONES ABSOLUTAS:
════════════════════════════════════
❌ Más de ${config.lineasMaxCuerpo + 3} líneas de texto en total (incluyendo hook y CTA)
❌ Contar una historia o desarrollar un contexto
❌ Listar más de 1 beneficio o feature del producto
❌ Frases de relleno: "sin precedentes", "al siguiente nivel", "de alta calidad", "increíble"
❌ Empezar con el nombre del producto — el hook va primero
❌ Más de 4 emojis en todo el post
❌ Bullet points o listas con íconos (❌ "✅ Feature 1 / ✅ Feature 2")
❌ Explicar por qué es bueno el producto — mostralo con 1 dato concreto y listo

════════════════════════════════════
ESTRUCTURA OBLIGATORIA:
════════════════════════════════════
${config.instruccion}

════════════════════════════════════
HOOKS DE REFERENCIA PARA ESTE TONO:
════════════════════════════════════
${hooks}

════════════════════════════════════
REGLA DE ORO DEL CTA:
════════════════════════════════════
El CTA siempre lleva a la web o genera una acción de contacto. Ejemplos válidos:
- "Link en bio 👆"
- "Entrá a la tienda — link en bio"
- "Hacé click en el link"
- "DM para el link directo"
Nunca: "¡Comprá ahora!" sin contexto de dónde comprar.`;

    // ── User prompt ───────────────────────────────────────────────────────────
    const userPrompt = `Escribí un post para ${redSocial} con tono ${tono}.

Producto: ${nombre}
${marca ? `Marca: ${marca}` : ''}
${categoria ? `Categoría: ${categoria}` : ''}
Feature principal (usá SOLO esta, no agregues más): ${descripcion || 'Producto premium.'}
Precio: $${precio}
${
  tieneOferta
    ? `Precio oferta: $${precioOferta} (${descuento} de descuento — USALO como gancho principal)`
    : 'Sin oferta activa.'
}

RECORDÁ: el post tiene que ser tan corto y directo que alguien que scrollea rápido lo lea completo en 3 segundos y quiera entrar a la web. Sin historia. Sin desarrollo. Hook → dato clave → precio → CTA.`;

    const response = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.75, // menos temperatura = más disciplina en el formato
      max_tokens: 350, // límite duro: si tiene más tokens, está escribiendo de más
    });

    return response.choices[0]?.message?.content ?? 'No se pudo generar el post.';
  }
}
