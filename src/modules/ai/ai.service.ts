import Groq from 'groq-sdk';

let groq: Groq | null = null;

export type AiObjective =
  | 'venta'
  | 'oferta'
  | 'nuevo_ingreso'
  | 'bajo_stock'
  | 'whatsapp'
  | 'recuperar_interes';

export interface GenerateMarketingKitOptions {
  redSocial: string;
  tono: string;
  objetivo: AiObjective;
}

export interface GeneratedMarketingKit {
  resumen: string;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  whatsapp: string;
  historia: string;
  ideasVisuales: string[];
  variantes: Array<{
    titulo: string;
    texto: string;
  }>;
  recomendaciones: string[];
}

function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no esta configurado en el servidor.');
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

const RED_SOCIAL_CONFIG: Record<string, { hashtags: number; limite: string }> = {
  instagram: {
    hashtags: 10,
    limite: 'caption de 5 a 7 lineas, con hashtags al final',
  },
  facebook: {
    hashtags: 4,
    limite: 'copy de 4 a 6 lineas, claro y conversacional',
  },
  tiktok: {
    hashtags: 6,
    limite: 'copy muy corto, 2 o 3 lineas, con lenguaje directo',
  },
  whatsapp: {
    hashtags: 0,
    limite: 'mensaje privado de 4 o 5 lineas, sin hashtags',
  },
};

const OBJETIVOS: Record<AiObjective, string> = {
  venta: 'vender el producto hoy con un mensaje directo',
  oferta: 'destacar una oferta o precio conveniente sin inventar descuentos',
  nuevo_ingreso: 'presentar el producto como novedad o recomendado',
  bajo_stock: 'mover unidades usando urgencia real solo si hay stock bajo',
  whatsapp: 'generar un mensaje listo para enviar por WhatsApp',
  recuperar_interes: 'volver a interesar a alguien que ya vio el producto',
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function cleanJsonPayload(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function normalizeKit(value: unknown, fallback: GeneratedMarketingKit): GeneratedMarketingKit {
  if (!value || typeof value !== 'object') return fallback;
  const data = value as Partial<GeneratedMarketingKit>;

  return {
    resumen: typeof data.resumen === 'string' ? data.resumen : fallback.resumen,
    hook: typeof data.hook === 'string' ? data.hook : fallback.hook,
    caption: typeof data.caption === 'string' ? data.caption : fallback.caption,
    cta: typeof data.cta === 'string' ? data.cta : fallback.cta,
    hashtags: asStringArray(data.hashtags).slice(0, 12),
    whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : fallback.whatsapp,
    historia: typeof data.historia === 'string' ? data.historia : fallback.historia,
    ideasVisuales: asStringArray(data.ideasVisuales).slice(0, 5),
    variantes: Array.isArray(data.variantes)
      ? data.variantes
          .filter((item): item is { titulo: string; texto: string } => {
            return (
              typeof item === 'object' &&
              item !== null &&
              typeof (item as { titulo?: unknown }).titulo === 'string' &&
              typeof (item as { texto?: unknown }).texto === 'string'
            );
          })
          .slice(0, 3)
      : fallback.variantes,
    recomendaciones: asStringArray(data.recomendaciones).slice(0, 5),
  };
}

function buildFallbackKit(producto: any, tienda: any, options: GenerateMarketingKitOptions): GeneratedMarketingKit {
  const precio = Number(producto.precio);
  const oferta = producto.precioOferta ? Number(producto.precioOferta) : null;
  const precioTexto = oferta && oferta < precio ? `$${oferta.toLocaleString('es-AR')}` : `$${precio.toLocaleString('es-AR')}`;
  const tiendaNombre = tienda?.nombre ?? 'tu tienda';
  const link = tienda?.slug ? `/tienda/${tienda.slug}` : 'tu tienda online';
  const hook = oferta && oferta < precio ? `Hoy ${producto.nombre} esta a ${precioTexto}` : `${producto.nombre} listo para pedir`;

  const caption = `${hook}\n${producto.descripcion ?? 'Una opcion practica para sumar a tu tienda.'}\n${precioTexto}\n\nMira el producto en ${link}.`;

  return {
    resumen: `Kit para ${options.redSocial} con foco en ${OBJETIVOS[options.objetivo]}.`,
    hook,
    caption,
    cta: `Entrar a ${tiendaNombre} y ver el producto`,
    hashtags: ['#tiendaonline', '#emprendimiento', '#comprasonline'],
    whatsapp: `Hola! Te paso ${producto.nombre}. Esta ${precioTexto}. Lo podes ver en ${link}.`,
    historia: `${producto.nombre}\n${precioTexto}\nDisponible en ${tiendaNombre}`,
    ideasVisuales: [
      'Foto clara del producto sobre fondo limpio.',
      'Primer plano del detalle mas importante.',
      'Historia con precio grande y boton de consulta.',
    ],
    variantes: [
      { titulo: 'Directo', texto: caption },
      { titulo: 'WhatsApp', texto: `Te paso este dato: ${producto.nombre} esta ${precioTexto}.` },
    ],
    recomendaciones: [
      producto.descripcion ? 'El producto tiene descripcion para alimentar el copy.' : 'Agrega una descripcion breve para mejorar el resultado.',
      producto.imagenPrincipalUrl ? 'Usa la imagen principal como visual base.' : 'Carga una imagen principal antes de publicar.',
    ],
  };
}

export class AiService {
  async generateSocialMediaKit(
    producto: any,
    options: GenerateMarketingKitOptions
  ): Promise<GeneratedMarketingKit> {
    const groqClient = getGroqClient();
    const redKey = normalizeKey(options.redSocial);
    const redConfig = RED_SOCIAL_CONFIG[redKey] ?? RED_SOCIAL_CONFIG.instagram;
    const objetivo = OBJETIVOS[options.objetivo] ?? OBJETIVOS.venta;
    const tienda = producto.tienda;
    const tiendaUrl = tienda?.slug ? `/tienda/${tienda.slug}` : null;
    const precio = Number(producto.precio);
    const precioOferta = producto.precioOferta ? Number(producto.precioOferta) : null;
    const tieneOferta = precioOferta !== null && precioOferta < precio;
    const stockTotal =
      Number(producto.stock ?? 0) +
      (Array.isArray(producto.variantes)
        ? producto.variantes.reduce((acc: number, variante: any) => acc + Number(variante.stock ?? 0), 0)
        : 0);

    const fallback = buildFallbackKit(producto, tienda, options);

    const context = {
      objetivo,
      redSocial: options.redSocial,
      formatoRed: redConfig.limite,
      tono: options.tono,
      tienda: {
        nombre: tienda?.nombre,
        ciudad: tienda?.ciudad,
        provincia: tienda?.provincia,
        whatsapp: tienda?.whatsapp,
        urlPublica: tiendaUrl,
        metodosPago: tienda?.metodosPago?.map((item: any) => ({
          nombre: item.metodoPago?.nombre,
          detalle: item.detalle,
        })),
        metodosEntrega: tienda?.metodosEntrega?.map((item: any) => ({
          nombre: item.metodoEntrega?.nombre,
          detalle: item.detalle,
          zonaCobertura: item.zonaCobertura,
        })),
      },
      producto: {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio,
        precioOferta,
        tieneOferta,
        moneda: producto.moneda,
        categoria: producto.categoria?.nombre,
        destacado: producto.destacado,
        disponible: producto.disponible,
        stockTotal,
        vistas: producto.vistas,
        tags: producto.tags?.map((tag: any) => tag.nombre),
        variantes: producto.variantes?.map((variante: any) => ({
          nombre: variante.nombre,
          precioExtra: Number(variante.precioExtra ?? 0),
          stock: variante.stock,
          disponible: variante.disponible,
        })),
        tieneImagenPrincipal: Boolean(producto.imagenPrincipalUrl),
        imagenesExtra: producto.imagenes?.length ?? 0,
      },
    };

    const systemPrompt = `Sos un community manager senior para tiendas online argentinas.
Tu trabajo no es solo escribir un caption: tenes que entregar un kit de publicacion util para una persona que vende desde su tienda.

Reglas:
- No inventes descuentos, stock, envios gratis ni beneficios que no esten en el contexto.
- Si falta informacion, inclui una recomendacion concreta.
- Escribi en espanol rioplatense simple.
- Mantenelo listo para copiar y publicar.
- El CTA debe llevar a la tienda, al link publico o a WhatsApp si corresponde.
- Devolve SOLO JSON valido, sin markdown.

Shape exacto:
{
  "resumen": "string",
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "hashtags": ["string"],
  "whatsapp": "string",
  "historia": "string",
  "ideasVisuales": ["string"],
  "variantes": [{ "titulo": "string", "texto": "string" }],
  "recomendaciones": ["string"]
}`;

    const userPrompt = `Genera el kit con este contexto:
${JSON.stringify(context, null, 2)}

Cantidad maxima:
- hashtags: ${redConfig.hashtags}
- ideasVisuales: 3
- variantes: 3
- recomendaciones: 3`;

    const response = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.65,
      max_tokens: 900,
    });

    const raw = response.choices[0]?.message?.content ?? '';

    try {
      return normalizeKit(JSON.parse(cleanJsonPayload(raw)), fallback);
    } catch {
      return {
        ...fallback,
        recomendaciones: [
          ...fallback.recomendaciones,
          'La IA devolvio un formato inesperado, se genero un kit base automaticamente.',
        ].slice(0, 5),
      };
    }
  }
}
