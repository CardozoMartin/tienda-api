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

export interface MarketingBlock {
  titulo: string;
  descripcion: string;
  caption: string;
  cta: string;
  hashtags: string[];
  whatsapp: string;
  historia: string;
  ideasVisuales: string[];
}

export interface GeneratedMarketingKit {
  resumen: string;
  hook: string;
  venta: MarketingBlock;
  promocion: MarketingBlock;
  organico: MarketingBlock;
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
  instagram: { hashtags: 10, limite: 'caption de 5 a 7 lineas, hashtags al final' },
  facebook:  { hashtags: 4,  limite: 'copy de 4 a 6 lineas, claro y conversacional' },
  tiktok:    { hashtags: 6,  limite: 'copy muy corto, 2 o 3 lineas, lenguaje directo' },
  whatsapp:  { hashtags: 0,  limite: 'mensaje privado de 4 o 5 lineas, sin hashtags' },
};

const OBJETIVOS: Record<AiObjective, string> = {
  venta:             'vender el producto hoy con un mensaje directo',
  oferta:            'destacar precio conveniente sin inventar descuentos',
  nuevo_ingreso:     'presentar el producto como novedad o recomendado',
  bajo_stock:        'mover unidades usando urgencia real si hay stock bajo',
  whatsapp:          'generar un mensaje listo para enviar por WhatsApp',
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

function asStringArray(value: unknown, max = 10): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, max);
}

function normalizeBlock(value: unknown, fallback: MarketingBlock): MarketingBlock {
  if (!value || typeof value !== 'object') return fallback;
  const d = value as Partial<MarketingBlock>;
  return {
    titulo:       typeof d.titulo       === 'string' ? d.titulo       : fallback.titulo,
    descripcion:  typeof d.descripcion  === 'string' ? d.descripcion  : fallback.descripcion,
    caption:      typeof d.caption      === 'string' ? d.caption      : fallback.caption,
    cta:          typeof d.cta          === 'string' ? d.cta          : fallback.cta,
    hashtags:     asStringArray(d.hashtags, 12),
    whatsapp:     typeof d.whatsapp     === 'string' ? d.whatsapp     : fallback.whatsapp,
    historia:     typeof d.historia     === 'string' ? d.historia     : fallback.historia,
    ideasVisuales: asStringArray(d.ideasVisuales, 4),
  };
}

function normalizeKit(value: unknown, fallback: GeneratedMarketingKit): GeneratedMarketingKit {
  if (!value || typeof value !== 'object') return fallback;
  const d = value as Partial<GeneratedMarketingKit>;
  return {
    resumen:         typeof d.resumen === 'string' ? d.resumen : fallback.resumen,
    hook:            typeof d.hook    === 'string' ? d.hook    : fallback.hook,
    venta:           normalizeBlock(d.venta,    fallback.venta),
    promocion:       normalizeBlock(d.promocion, fallback.promocion),
    organico:        normalizeBlock(d.organico,  fallback.organico),
    recomendaciones: asStringArray(d.recomendaciones, 5),
  };
}

function buildFallbackBlock(
  producto: any,
  tienda: any,
  tipo: 'venta' | 'promocion' | 'organico',
): MarketingBlock {
  const precio = Number(producto.precio);
  const oferta = producto.precioOferta ? Number(producto.precioOferta) : null;
  const precioTexto = oferta && oferta < precio
    ? `$${oferta.toLocaleString('es-AR')} (antes $${precio.toLocaleString('es-AR')})`
    : `$${precio.toLocaleString('es-AR')}`;
  const tiendaNombre = tienda?.nombre ?? 'tu tienda';
  const link = tienda?.slug ? `/tienda/${tienda.slug}` : 'tu tienda';

  const bases: Record<string, MarketingBlock> = {
    venta: {
      titulo: 'Publicacion de Venta',
      descripcion: 'Copy directo orientado a cerrar la venta hoy.',
      caption: `${producto.nombre} disponible ahora.\n${producto.descripcion ?? ''}\n${precioTexto}\nEntrar a ${link}`,
      cta: `Ir a ${tiendaNombre}`,
      hashtags: ['#venta', '#tiendaonline', '#comprasonline'],
      whatsapp: `Hola! Te comparto ${producto.nombre} a ${precioTexto}. Lo ves en ${link}.`,
      historia: `${producto.nombre}\n${precioTexto}\nDisponible en ${tiendaNombre}`,
      ideasVisuales: ['Foto del producto sobre fondo blanco limpio.', 'Precio grande y visible.'],
    },
    promocion: {
      titulo: 'Publicacion de Promocion',
      descripcion: 'Copy orientado a destacar el precio o beneficio.',
      caption: `Oportunidad en ${tiendaNombre}.\n${producto.nombre} a ${precioTexto}.\n${producto.descripcion ?? ''}\nVer en ${link}`,
      cta: `Ver oferta en ${tiendaNombre}`,
      hashtags: ['#oferta', '#precio', '#tiendaonline'],
      whatsapp: `Te mando esta oferta: ${producto.nombre} a ${precioTexto}. Disponible en ${link}.`,
      historia: `OFERTA\n${producto.nombre}\n${precioTexto}`,
      ideasVisuales: ['Sticker de oferta o porcentaje de descuento.', 'Fondo colorido que contraste.'],
    },
    organico: {
      titulo: 'Contenido Organico',
      descripcion: 'Copy orientado a generar engagement sin presion de venta.',
      caption: `Conoces ${producto.nombre}?\n${producto.descripcion ?? ''}\nDisponible en ${tiendaNombre}.`,
      cta: `Conoce mas en ${tiendaNombre}`,
      hashtags: ['#emprendimiento', '#tiendaargentina', '#novedades'],
      whatsapp: `Che, mira lo que hay en ${tiendaNombre}: ${producto.nombre}. Que te parece?`,
      historia: `${producto.nombre}\nen ${tiendaNombre}`,
      ideasVisuales: ['Foto lifestyle mostrando el producto en uso.', 'Texto casual, sin precio visible.'],
    },
  };

  return bases[tipo];
}

function buildFallbackKit(producto: any, tienda: any, options: GenerateMarketingKitOptions): GeneratedMarketingKit {
  return {
    resumen: `Kit para ${options.redSocial} — objetivo: ${OBJETIVOS[options.objetivo]}.`,
    hook: `${producto.nombre} listo para pedir`,
    venta:    buildFallbackBlock(producto, tienda, 'venta'),
    promocion: buildFallbackBlock(producto, tienda, 'promocion'),
    organico:  buildFallbackBlock(producto, tienda, 'organico'),
    recomendaciones: [
      producto.descripcion ? 'El producto tiene descripcion.' : 'Agrega una descripcion para mejorar el copy.',
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
    const descuentoPct = tieneOferta && precioOferta
      ? Math.round(((precio - precioOferta) / precio) * 100)
      : null;

    const stockTotal =
      Number(producto.stock ?? 0) +
      (Array.isArray(producto.variantes)
        ? producto.variantes.reduce((acc: number, v: any) => acc + Number(v.stock ?? 0), 0)
        : 0);

    // Datos de ventas reales del producto
    const pedidosProducto = Array.isArray(producto.pedidoItems) ? producto.pedidoItems : [];
    const totalVendido = pedidosProducto.reduce((acc: number, item: any) => acc + Number(item.cantidad ?? 0), 0);
    const ingresoTotal = pedidosProducto.reduce((acc: number, item: any) => acc + Number(item.subtotal ?? 0), 0);

    // Reseñas
    const resenas = Array.isArray(producto.resenas) ? producto.resenas : [];
    const calificacionPromedio = resenas.length > 0
      ? (resenas.reduce((acc: number, r: any) => acc + Number(r.calificacion ?? 0), 0) / resenas.length).toFixed(1)
      : null;

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
        instagram: tienda?.instagram ?? null,
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
        descuentoPct,
        moneda: producto.moneda,
        categoria: producto.categoria?.nombre,
        destacado: producto.destacado,
        disponible: producto.disponible,
        stockTotal,
        vistas: producto.vistas,
        tags: producto.tags?.map((tag: any) => tag.nombre),
        variantes: producto.variantes?.map((v: any) => ({
          nombre: v.nombre,
          precioExtra: Number(v.precioExtra ?? 0),
          stock: v.stock,
          disponible: v.disponible,
        })),
        tieneImagenPrincipal: Boolean(producto.imagenPrincipalUrl),
        imagenesExtra: producto.imagenes?.length ?? 0,
        // Datos de ventas reales para enriquecer el copy
        totalUnidadesVendidas: totalVendido,
        ingresoGenerado: ingresoTotal,
        calificacionPromedio,
        cantidadResenas: resenas.length,
      },
    };

    const systemPrompt = `Sos un experto en marketing digital para tiendas online argentinas de emprendedores.
Tu tarea es generar un kit de marketing completo dividido en 3 bloques estrategicos: venta directa, promocion y contenido organico.
Cada bloque tiene un proposito distinto y debe reflejar eso en el tono y el copy.

REGLAS CRITICAS:
- No inventes descuentos, envios gratis ni beneficios que no esten en el contexto.
- Si el producto tiene ventas reales (totalUnidadesVendidas > 0), usalo como prueba social ("ya vendimos X unidades", "uno de los mas pedidos").
- Si tiene calificacion, usala ("calificado con ${calificacionPromedio ?? 'N/A'} estrellas por clientes reales").
- Si tiene oferta, calcula y menciona el descuento real (descuentoPct%).
- Si el stock es bajo (menos de 5), usa urgencia real.
- Escribe en espanol rioplatense natural, como habla un vendedor argentino real.
- El CTA siempre debe dirigir a la tienda o WhatsApp segun corresponda.
- Devuelve SOLO JSON valido, sin markdown, sin explicaciones.

Shape exacto del JSON:
{
  "resumen": "string — una frase que describe de que trata este kit",
  "hook": "string — la frase de gancho principal del producto",
  "venta": {
    "titulo": "Publicacion de Venta",
    "descripcion": "string — para que sirve este bloque",
    "caption": "string — copy para publicar, listo para copiar",
    "cta": "string — llamada a la accion",
    "hashtags": ["string"],
    "whatsapp": "string — mensaje listo para enviar por WhatsApp",
    "historia": "string — texto para historia de Instagram/Facebook (corto)",
    "ideasVisuales": ["string"]
  },
  "promocion": {
    "titulo": "Publicacion de Promocion",
    "descripcion": "string",
    "caption": "string",
    "cta": "string",
    "hashtags": ["string"],
    "whatsapp": "string",
    "historia": "string",
    "ideasVisuales": ["string"]
  },
  "organico": {
    "titulo": "Contenido Organico",
    "descripcion": "string",
    "caption": "string",
    "cta": "string",
    "hashtags": ["string"],
    "whatsapp": "string",
    "historia": "string",
    "ideasVisuales": ["string"]
  },
  "recomendaciones": ["string — consejo accionable para el vendedor basado en lo que falta o puede mejorar"]
}`;

    const userPrompt = `Genera el kit con este contexto real del producto y la tienda:
${JSON.stringify(context, null, 2)}

Limites por bloque:
- hashtags: ${redConfig.hashtags} maximo
- ideasVisuales: 3 maximo
- recomendaciones: 4 maximo, solo si hay algo concreto para mejorar`;

    const response = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.82,
      max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content ?? '';

    try {
      return normalizeKit(JSON.parse(cleanJsonPayload(raw)), fallback);
    } catch {
      return {
        ...fallback,
        recomendaciones: [
          ...fallback.recomendaciones,
          'La IA devolvio un formato inesperado. Se genero un kit base automaticamente.',
        ].slice(0, 5),
      };
    }
  }
}
