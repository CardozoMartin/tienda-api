// Service de tiendas.
// Lógica de negocio: validaciones, generación de slugs únicos, control de permisos.
import { randomBytes } from "crypto";
import { resolveTxt } from "dns/promises";
import { TiendasRepository } from "./tiendas.repository";
import { ErrorApi } from "../../types";
import { generarSlug, generarSlugUnico, construirPaginacion } from "../../utils/helpers";
import {
  CrearTiendaDto,
  ActualizarTiendaDto,
  ActualizarTemaDto,
  AgregarMetodoPagoDto,
  ActualizarMetodoPagoDto,
  AgregarMetodoEntregaDto,
  ActualizarMetodoEntregaDto,
  AgregarImagenCarruselDto,
  ActualizarImagenCarruselDto,
  AgregarCategoriaDestacadaDto,
  ActualizarCategoriaDestacadaDto,
  FiltrosTiendasDto,
  ActualizarAboutUsDto,
  ActualizarMarqueeDto,
  CambiarSlugDto,
} from "./tiendas.dto";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { cacheService } from "../../utils/cache";
import { logger } from "../../utils/logger";
import { cifrar, descifrar } from "../../utils/cifrado";
import { GuardarConfigEmailDto } from "./tiendas.dto";
import nodemailer from "nodemailer";

export class TiendasService {
  private repository: TiendasRepository;

  constructor() {
    this.repository = new TiendasRepository();
  }

  //Servicio para crear una tienda para un usuario autenticado, con validación de que no tenga ya una tienda, generación de slug único, y manejo de errores.
  async crear(usuarioId: number, datos: CrearTiendaDto) {
    // Verificamos que el usuario no tenga ya una tienda
    const tiendaExistente = await this.repository.buscarPorUsuarioId(usuarioId);
    if (tiendaExistente) {
      throw new ErrorApi("Ya tenés una tienda creada. Solo se permite una por cuenta.", 409);
    }

    // Si el usuario eligió un slug, lo usamos; si no, lo generamos desde el nombre
    let slug = datos.slug ? generarSlug(datos.slug) : generarSlug(datos.nombre);

    // Si el slug fue ingresado manualmente, lo validamos y rechazamos si ya existe
    const slugOcupado = await this.repository.existeSlug(slug);
    if (slugOcupado) {
      if (datos.slug) {
        throw new ErrorApi(`El slug "${slug}" no está disponible`, 409);
      }
      slug = generarSlugUnico(datos.nombre);
    }

    const tienda = await this.repository.crear({
      usuarioId,
      slug,
      nombre: datos.nombre,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      rubro: datos.rubro,
      whatsapp: datos.whatsapp,
      instagram: datos.instagram,
      facebook: datos.facebook,
      sitioWeb: datos.sitioWeb,
      pais: datos.pais,
      provincia: datos.provincia,
      ciudad: datos.ciudad,
    });

    return tienda;
  }

  //Servicio para obtener la tienda de un usuario autenticado. Si no tiene tienda, devuelve error 404.
  async obtenerMiTienda(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada todavía", 404);
    }
    return tienda;
  }

  //Servicio para obtener una tienda por su slug, solo si está activa y pública. Si no se encuentra, devuelve error 404.
  async obtenerPorSlug(slug: string) {
    const cacheKey = `tienda_slug_${slug}`;
    let tienda: any = cacheService.get(cacheKey);

    if (!tienda) {
      tienda = await this.repository.buscarPorSlug(slug);
      if (!tienda || !tienda.activa || !tienda.publica) {
        throw new ErrorApi("Tienda no encontrada", 404);
      }
      cacheService.set(cacheKey, tienda);
    }

    // Incrementamos las vistas de forma asíncrona, sin bloquear la respuesta
    this.repository.incrementarVistas(tienda.id).catch((err) =>
      logger.error("[TIENDAS] Error al incrementar vistas:", err)
    );

    return this.sanitizarTiendaPublica(tienda);
  }

  //Servicio para obtener una tienda por su dominio propio (ej: www.mitienda.com).
  //Igual que obtenerPorSlug, pero con una regla extra: el dominio debe estar VERIFICADO.
  //Así evitamos que alguien cargue un dominio ajeno y se sirva la tienda sin probar que es suyo.
  async obtenerPorDominio(dominio: string) {
    //1.- Normalizamos el dominio: quitamos espacios y lo pasamos a minúsculas.
    const dominioNormalizado = dominio.trim().toLowerCase();
    //2.- Buscamos en caché primero, para no saturar la base de datos con consultas a dominios inexistentes.
    const cacheKey = `tienda_dominio_${dominioNormalizado}`;
    let tienda: any = cacheService.get(cacheKey);

    //3.- Si no está en caché, buscamos en la base de datos. Solo devolvemos la tienda si está activa, pública y con dominio verificado.
    if (!tienda) {
      tienda = await this.repository.buscarPorDominio(dominioNormalizado);
      if (!tienda || !tienda.dominioVerificado || !tienda.activa || !tienda.publica) {
        throw new ErrorApi("Tienda no encontrada", 404);
      }
      cacheService.set(cacheKey, tienda);
    }

    // Incrementamos las vistas de forma asíncrona, sin bloquear la respuesta
    this.repository.incrementarVistas(tienda.id).catch((err) =>
      logger.error("[TIENDAS] Error al incrementar vistas:", err)
    );

    return this.sanitizarTiendaPublica(tienda);
  }

  //Servicio para que el dueño cargue/cambie el dominio propio de su tienda.
  //Guarda el dominio como NO verificado y genera un token para la verificación por DNS (registro TXT).
  //Devuelve la instrucción que el usuario debe configurar en su proveedor de dominio.
  async guardarDominio(usuarioId: number, dominio: string) {
    //1.- Buscamos la tienda del usuario. Si no tiene, devolvemos error 404.
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }

    // Validamos que el dominio no esté tomado por otra tienda.
    const ocupado = await this.repository.existeDominio(dominio, tienda.id);
    if (ocupado) {
      throw new ErrorApi(`El dominio "${dominio}" ya está en uso por otra tienda`, 409);
    }

    // Generamos un token único que el usuario deberá publicar como registro TXT en su DNS.
    const token = `tiendizi-verify=${randomBytes(16).toString("hex")}`;

    await this.repository.actualizar(tienda.id, {
      dominioPersonalizado: dominio,
      dominioVerificado: false, // al cambiar el dominio, se debe verificar de nuevo
      dominioTokenVerif: token,
    });

    // Si el dominio cambió, invalidamos cualquier caché del dominio anterior.
    if (tienda.dominioPersonalizado) {
      cacheService.del(`tienda_dominio_${tienda.dominioPersonalizado}`);
    }

    // Instrucción para el panel: el TXT para verificar propiedad y el CNAME para apuntar.
    return {
      dominio,
      verificado: false,
      instruccionDns: {
        tipo: "TXT",
        host: "@",
        valor: token,
        ayuda: `Agregá un registro TXT en tu proveedor de dominio con este valor, y luego presioná "Verificar".`,
      },
      instruccionApuntado: this.instruccionApuntado(),
    };
  }

  //Servicio para VERIFICAR la propiedad del dominio consultando el DNS real.
  //Lee los registros TXT del dominio y comprueba que el token que generamos esté publicado.
  //Si coincide, marca el dominio como verificado y ya puede servirse la tienda por él.
  async verificarDominio(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    if (!tienda.dominioPersonalizado || !tienda.dominioTokenVerif) {
      throw new ErrorApi("Primero cargá un dominio para verificar", 400);
    }
    if (tienda.dominioVerificado) {
      return { verificado: true, mensaje: "El dominio ya estaba verificado" };
    }

    // Consultamos los registros TXT del dominio en el DNS público.
    let registrosTxt: string[][];
    try {
      registrosTxt = await resolveTxt(tienda.dominioPersonalizado);
    } catch (err) {
      // ENOTFOUND/ENODATA = el dominio no tiene registros TXT (o no existe / aún no propaga).
      logger.warn(`[DOMINIO] No se pudieron leer TXT de ${tienda.dominioPersonalizado}:`, err);
      throw new ErrorApi(
        "No encontramos el registro TXT todavía. Revisá que esté bien cargado; el DNS puede tardar unos minutos en propagar.",
        422
      );
    }

    // Cada registro TXT puede venir partido en varios fragmentos; los unimos antes de comparar.
    const valores = registrosTxt.map((partes) => partes.join(""));
    const coincide = valores.includes(tienda.dominioTokenVerif);

    if (!coincide) {
      throw new ErrorApi(
        "El registro TXT no coincide. Verificá que copiaste el valor exacto y esperá unos minutos a que propague.",
        422
      );
    }

    // ¡Verificado! Marcamos la tienda y limpiamos el token (ya no se necesita).
    await this.repository.actualizar(tienda.id, {
      dominioVerificado: true,
      dominioTokenVerif: null,
    });

    return { verificado: true, dominio: tienda.dominioPersonalizado, mensaje: "Dominio verificado correctamente" };
  }

  // Instrucción del registro CNAME que apunta el dominio del usuario a nuestra
  // plataforma (Netlify). Esto es lo que hace que el dominio CARGUE la tienda
  // (distinto de la verificación TXT, que solo prueba la propiedad).
  private instruccionApuntado() {
    const destino = process.env.STOREFRONT_HOST ?? "apptiendizi.netlify.app";
    return {
      tipo: "CNAME",
      host: "www",
      valor: destino,
      ayuda: `Apuntá tu dominio a nuestra plataforma con este registro CNAME para que cargue tu tienda.`,
    };
  }

  //Servicio para obtener el estado actual del dominio del dueño (para mostrar en el panel).
  async obtenerEstadoDominio(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    return {
      dominio: tienda.dominioPersonalizado ?? null,
      verificado: tienda.dominioVerificado,
      instruccionDns: tienda.dominioTokenVerif
        ? { tipo: "TXT", host: "@", valor: tienda.dominioTokenVerif }
        : null,
      instruccionApuntado: tienda.dominioPersonalizado ? this.instruccionApuntado() : null,
    };
  }

  // ─────────────────────────────────────────────
  // CONFIG DE EMAIL MARKETING (proveedor propio del dueño)
  // ─────────────────────────────────────────────

  // Defaults de host/puerto según proveedor, para que el dueño no tenga que saberlos.
  private datosSmtpPorProveedor(
    proveedor: GuardarConfigEmailDto["proveedor"],
    host?: string,
    port?: number
  ): { host: string | null; port: number | null } {
    if (proveedor === "gmail") {
      return { host: host ?? "smtp.gmail.com", port: port ?? 587 };
    }
    if (proveedor === "smtp") {
      return { host: host ?? null, port: port ?? 587 };
    }
    // brevo se maneja por API, no por SMTP.
    return { host: null, port: null };
  }

  // Guarda la configuración del proveedor de email del dueño. La credencial se
  // cifra antes de persistir. Cambiar la config marca emailVerificadoConfig=false
  // hasta que se pruebe la conexión con verificarConfigEmail.
  async guardarConfigEmail(usuarioId: number, datos: GuardarConfigEmailDto) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }

    // La credencial es opcional al editar: si no se manda, conservamos la guardada.
    // Pero si nunca hubo credencial, es obligatoria.
    if (!datos.credencial && !tienda.emailCredencial) {
      throw new ErrorApi(
        datos.proveedor === "brevo"
          ? "Ingresá tu API key de Brevo"
          : "Ingresá la contraseña / app password del email",
        400
      );
    }

    const { host, port } = this.datosSmtpPorProveedor(datos.proveedor, datos.host, datos.port);

    await this.repository.actualizar(tienda.id, {
      emailProveedor: datos.proveedor,
      emailRemitente: datos.remitente,
      emailRemitenteNombre: datos.remitenteNombre ?? null,
      emailHost: host,
      emailPort: port,
      // En SMTP/Gmail el usuario suele ser el mismo email; si no lo mandan, usamos el remitente.
      emailUsuario: datos.proveedor === "brevo" ? null : datos.usuario ?? datos.remitente,
      // Solo re-ciframos si llegó una credencial nueva; si no, dejamos la existente.
      ...(datos.credencial ? { emailCredencial: cifrar(datos.credencial) } : {}),
      // Cualquier cambio de config invalida la verificación previa.
      emailVerificadoConfig: false,
    });

    return this.obtenerConfigEmail(usuarioId);
  }

  // Estado de la config para el panel. NUNCA expone la credencial: solo si hay
  // una cargada (para que el front muestre "••••" y no la pida de nuevo).
  async obtenerConfigEmail(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    return {
      proveedor: tienda.emailProveedor ?? null,
      remitente: tienda.emailRemitente ?? null,
      remitenteNombre: tienda.emailRemitenteNombre ?? null,
      host: tienda.emailHost ?? null,
      port: tienda.emailPort ?? null,
      usuario: tienda.emailUsuario ?? null,
      tieneCredencial: !!tienda.emailCredencial,
      verificado: tienda.emailVerificadoConfig,
      // El dueño no puede mandar campañas hasta tener config verificada.
      listoParaEnviar: !!tienda.emailProveedor && tienda.emailVerificadoConfig,
    };
  }

  // Elimina la configuración de email del dueño: limpia proveedor, remitente,
  // credencial cifrada y datos SMTP, y marca la config como no verificada.
  // Después de esto, el dueño no puede enviar campañas hasta reconfigurar.
  async eliminarConfigEmail(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    await this.repository.actualizar(tienda.id, {
      emailProveedor: null,
      emailRemitente: null,
      emailRemitenteNombre: null,
      emailHost: null,
      emailPort: null,
      emailUsuario: null,
      emailCredencial: null,
      emailVerificadoConfig: false,
    });
    return this.obtenerConfigEmail(usuarioId);
  }

  // Prueba REAL que las credenciales funcionan. Para SMTP/Gmail abre la conexión
  // con nodemailer y hace verify(); para Brevo pega a su API de cuenta.
  // Si todo va bien, marca emailVerificadoConfig=true.
  async verificarConfigEmail(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    if (!tienda.emailProveedor || !tienda.emailCredencial) {
      throw new ErrorApi("Primero configurá tu proveedor de email", 400);
    }

    const credencial = descifrar(tienda.emailCredencial);

    if (tienda.emailProveedor === "brevo") {
      await this.verificarBrevo(credencial);
    } else {
      await this.verificarSmtp(tienda, credencial);
    }

    await this.repository.actualizar(tienda.id, { emailVerificadoConfig: true });
    return { verificado: true, mensaje: "Conexión con tu proveedor de email verificada correctamente" };
  }

  // Verifica la API key de Brevo consultando su endpoint de cuenta.
  private async verificarBrevo(apiKey: string) {
    let res: Response;
    try {
      res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": apiKey, accept: "application/json" },
      });
    } catch (err) {
      logger.warn("[EMAIL-CONFIG] Error de red verificando Brevo:", err);
      throw new ErrorApi("No pudimos conectar con Brevo. Intentá de nuevo en un momento.", 502);
    }
    if (res.status === 401) {
      throw new ErrorApi("La API key de Brevo es inválida. Revisá que la copiaste completa.", 422);
    }
    if (!res.ok) {
      throw new ErrorApi("Brevo rechazó la conexión. Verificá tu API key.", 422);
    }
  }

  // Verifica conexión SMTP (Gmail u otro) abriendo el transport y haciendo verify().
  private async verificarSmtp(tienda: any, password: string) {
    if (!tienda.emailHost) {
      throw new ErrorApi("Falta el host SMTP en la configuración", 400);
    }
    const transporter = nodemailer.createTransport({
      host: tienda.emailHost,
      port: tienda.emailPort ?? 587,
      secure: (tienda.emailPort ?? 587) === 465,
      auth: { user: tienda.emailUsuario ?? tienda.emailRemitente, pass: password },
    });
    try {
      await transporter.verify();
    } catch (err) {
      logger.warn(`[EMAIL-CONFIG] Falló verify SMTP de tienda ${tienda.id}:`, err);
      throw new ErrorApi(
        "No pudimos conectar con tu servidor de email. Revisá el host, el usuario y la contraseña " +
          "(en Gmail tenés que usar una 'contraseña de aplicación', no la de tu cuenta).",
        422
      );
    }
  }

  /**
   * Limpia datos sensibles antes de exponer la tienda públicamente.
   * Del configExtra de cada método de pago solo dejamos los datos que el
   * comprador necesita ver (transferencia: cbu/alias/banco/titular) y
   * eliminamos cualquier credencial (tokens de Mercado Pago, etc.).
   */
  private sanitizarTiendaPublica(tienda: any) {
    if (!tienda?.metodosPago) return tienda;

    const CAMPOS_PUBLICOS = ['cbu', 'alias', 'banco', 'titular'];

    const metodosPago = tienda.metodosPago
      // Mercado Pago solo se ofrece al cliente si la conexión está verificada (estadoMp === 'activo').
      .filter((mp: any) => {
        const esMp = (mp.metodoPago?.nombre ?? '').toLowerCase().includes('mercado');
        if (!esMp) return true;
        const config = (mp.configExtra ?? {}) as Record<string, any>;
        return config.estadoMp === 'activo' && !!config.mpAccessToken;
      })
      .map((mp: any) => {
        const config = (mp.configExtra ?? {}) as Record<string, any>;
        const configPublico: Record<string, any> = {};
        for (const campo of CAMPOS_PUBLICOS) {
          if (config[campo]) configPublico[campo] = config[campo];
        }
        return { ...mp, configExtra: configPublico };
      });

    return { ...tienda, metodosPago };
  }

  //Servicio para actualizar la tienda de un usuario autenticado, con validación de que tenga una tienda, generación de slug único si cambia el nombre, y manejo de errores.
  async actualizar(usuarioId: number, datos: ActualizarTiendaDto) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }

    // Si se quiere cambiar el nombre, regeneramos el slug
    let datosActualizacion: typeof datos & { slug?: string } = { ...datos };

    // Datos legales: string vacío → null para poder limpiarlos
    for (const campo of ['razonSocial', 'cuit', 'domicilioLegal'] as const) {
      if ((datosActualizacion as any)[campo] === '') (datosActualizacion as any)[campo] = null;
    }

    if (datos.nombre && datos.nombre !== tienda.nombre) {
      let nuevoSlug = generarSlug(datos.nombre);
      const slugOcupado = await this.repository.existeSlug(nuevoSlug, tienda.id);
      if (slugOcupado) {
        nuevoSlug = generarSlugUnico(datos.nombre);
      }
      datosActualizacion = { ...datosActualizacion, slug: nuevoSlug };
    }

    const resultado = await this.repository.actualizar(tienda.id, datosActualizacion);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  //servicio para ctualizar el tema de una tienda
  //Falta Agregar alguna forma para que no cambie el tema cada que quiera porque se llena de peticiones de cambios de temas por un solo usuario agregar alguna validacion para que se cambien por algun tiempo !!! A TESTEAR
  async actualizarTema(usuarioId: number, datos: ActualizarTemaDto) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    const resultado = await this.repository.actualizarTema(tienda.id, datos);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  //Servicio para listar las tiendas con filtros de búsqueda, paginación y ordenamiento, devolviendo los datos y el total para construir la paginación en el frontend.
  async listar(filtros: FiltrosTiendasDto) {
    const { datos, total } = await this.repository.listar(filtros);
    return construirPaginacion(datos, total, filtros.pagina, filtros.limite);
  }

  // Catálogo de métodos

  async listarMetodosPagoCatalogo() {
    return this.repository.listarCatalogoMetodosPago();
  }

  async listarMetodosEntregaCatalogo() {
    return this.repository.listarCatalogoMetodosEntrega();
  }

  // Métodos de pago (tienda)

  async agregarMetodoPago(usuarioId: number, datos: AgregarMetodoPagoDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const result = await this.repository.agregarMetodoPago(tienda.id, datos.metodoPagoId, datos.detalle, datos.configExtra);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async actualizarMetodoPago(usuarioId: number, metodoPagoId: number, datos: ActualizarMetodoPagoDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const result = await this.repository.actualizarMetodoPago(tienda.id, metodoPagoId, datos);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async eliminarMetodoPago(usuarioId: number, metodoPagoId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarMetodoPago(tienda.id, metodoPagoId);
    this.invalidarCacheTienda(tienda.slug);
  }

  //Métodos de entrega

  async agregarMetodoEntrega(usuarioId: number, datos: AgregarMetodoEntregaDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const { metodoEntregaId, ...resto } = datos;
    const result = await this.repository.agregarMetodoEntrega(tienda.id, metodoEntregaId, resto);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async actualizarMetodoEntrega(usuarioId: number, metodoEntregaId: number, datos: ActualizarMetodoEntregaDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const result = await this.repository.actualizarMetodoEntrega(tienda.id, metodoEntregaId, datos);
    this.invalidarCacheTienda(tienda.slug);
    return result;
  }

  async eliminarMetodoEntrega(usuarioId: number, metodoEntregaId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarMetodoEntrega(tienda.id, metodoEntregaId);
    this.invalidarCacheTienda(tienda.slug);
  }

  // Carrusel

  async listarCarruselAdmin(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.listarCarruselAdmin(tienda.id);
  }

  async agregarImagenCarrusel(
    usuarioId: number,
    datos: AgregarImagenCarruselDto,
    buffers: Express.Multer.File[] = []
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const imagenesCreadas = [];
    const camposExtra = {
      tipo: datos.tipo,
      etiqueta: datos.etiqueta,
      fechaDesde: datos.fechaDesde ?? null,
      fechaHasta: datos.fechaHasta ?? null,
    };

    if (buffers && buffers.length > 0) {
      for (const file of buffers) {
        const url = await uploadImageToCloudinary(file.buffer);
        const resultado = await this.repository.agregarImagenCarrusel(tienda.id, {
          url,
          titulo: datos.titulo,
          subtitulo: datos.subtitulo,
          linkUrl: datos.linkUrl,
          orden: datos.orden,
          ...camposExtra,
        });
        imagenesCreadas.push(resultado);
      }
    } else if (datos.url) {
      const resultado = await this.repository.agregarImagenCarrusel(tienda.id, {
        url: datos.url,
        titulo: datos.titulo,
        subtitulo: datos.subtitulo,
        linkUrl: datos.linkUrl,
        orden: datos.orden,
        ...camposExtra,
      });
      imagenesCreadas.push(resultado);
    }

    this.invalidarCacheTienda(tienda.slug);
    return imagenesCreadas;
  }

  async actualizarImagenCarrusel(usuarioId: number, imagenId: number, datos: ActualizarImagenCarruselDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.actualizarImagenCarrusel(imagenId, tienda.id, datos);
    this.invalidarCacheTienda(tienda.slug);
    return this.repository.listarCarruselAdmin(tienda.id);
  }

  async eliminarImagenCarrusel(usuarioId: number, imagenId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarImagenCarrusel(imagenId, tienda.id);
    this.invalidarCacheTienda(tienda.slug);
  }

  async reordenarCarrusel(
    usuarioId: number,
    orden: Array<{ id: number; orden: number }>
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.reordenarCarrusel(tienda.id, orden);
    this.invalidarCacheTienda(tienda.slug);
  }

  // Categorías destacadas

  async listarCategoriasDestacadas(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.listarCategoriasDestacadas(tienda.id);
  }

  async agregarCategoriaDestacada(
    usuarioId: number,
    datos: AgregarCategoriaDestacadaDto,
    file?: Express.Multer.File
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    let imagenUrl = datos.imagenUrl;
    if (file) {
      imagenUrl = await uploadImageToCloudinary(file.buffer);
    }
    if (!imagenUrl) {
      throw new ErrorApi('La imagen es requerida', 400);
    }
    const resultado = await this.repository.agregarCategoriaDestacada(tienda.id, {
      imagenUrl,
      titulo: datos.titulo,
      linkUrl: datos.linkUrl,
      orden: datos.orden,
    });
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  async actualizarCategoriaDestacada(
    usuarioId: number,
    id: number,
    datos: ActualizarCategoriaDestacadaDto,
    file?: Express.Multer.File
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const patch = { ...datos };
    if (file) {
      patch.imagenUrl = await uploadImageToCloudinary(file.buffer);
    }
    await this.repository.actualizarCategoriaDestacada(id, tienda.id, patch);
    this.invalidarCacheTienda(tienda.slug);
    return this.repository.listarCategoriasDestacadas(tienda.id);
  }

  async eliminarCategoriaDestacada(usuarioId: number, id: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.eliminarCategoriaDestacada(id, tienda.id);
    this.invalidarCacheTienda(tienda.slug);
  }

  async reordenarCategoriasDestacadas(
    usuarioId: number,
    orden: Array<{ id: number; orden: number }>
  ) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    await this.repository.reordenarCategoriasDestacadas(tienda.id, orden);
    this.invalidarCacheTienda(tienda.slug);
  }

  // Métodos privados

  private async obtenerTiendaOFallar(usuarioId: number) {
    const tienda = await this.repository.buscarPorUsuarioId(usuarioId);
    if (!tienda) {
      throw new ErrorApi("No tenés ninguna tienda creada", 404);
    }
    return tienda;
  }

  private invalidarCacheTienda(slug: string) {
    cacheService.del(`tienda_slug_${slug}`);
    // También podríamos purgar los productos con flushPrefix(`productos_tienda_${id}`)
  }

  // About Us

  async obtenerAboutUs(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.buscarAboutUs(tienda.id);
  }

  async actualizarAboutUs(usuarioId: number, datos: ActualizarAboutUsDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const resultado = await this.repository.actualizarAboutUs(tienda.id, datos);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  async subirImagenAboutUs(usuarioId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const url = await uploadImageToCloudinary(file.buffer);
    const resultado = await this.repository.actualizarAboutUs(tienda.id, { imagenUrl: url });
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  async subirImagenBannerPromo(usuarioId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const url = await uploadImageToCloudinary(file.buffer);
    await this.repository.actualizarTema(tienda.id, { bannerPromoImagenUrl: url } as any);
    this.invalidarCacheTienda(tienda.slug);
    return { bannerPromoImagenUrl: url };
  }

  //Marquee

  async obtenerMarquee(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    return this.repository.listarMarquee(tienda.id);
  }

  async actualizarMarquee(usuarioId: number, datos: ActualizarMarqueeDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const resultado = await this.repository.actualizarMarquee(tienda.id, datos.items);
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  // ── Logo ──

  async subirLogo(usuarioId: number, file: Express.Multer.File) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const url = await uploadImageToCloudinary(file.buffer);
    const resultado = await this.repository.actualizar(tienda.id, { logoUrl: url });
    this.invalidarCacheTienda(tienda.slug);
    return { logoUrl: url, tienda: resultado };
  }

  async eliminarLogo(usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const resultado = await this.repository.actualizar(tienda.id, { logoUrl: null });
    this.invalidarCacheTienda(tienda.slug);
    return resultado;
  }

  // ── Slug ──

  async cambiarSlug(usuarioId: number, datos: CambiarSlugDto) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const nuevoSlug = generarSlug(datos.slug);
    const ocupado = await this.repository.existeSlug(nuevoSlug, tienda.id);
    if (ocupado) {
      throw new ErrorApi(`El slug "${nuevoSlug}" ya está en uso`, 409);
    }
    const slugAnterior = tienda.slug;
    const resultado = await this.repository.actualizar(tienda.id, { slug: nuevoSlug });
    this.invalidarCacheTienda(slugAnterior);
    return resultado;
  }

  async verificarSlug(slug: string, usuarioId: number) {
    const tienda = await this.obtenerTiendaOFallar(usuarioId);
    const normalizado = generarSlug(slug);
    const ocupado = await this.repository.existeSlug(normalizado, tienda.id);
    return { slug: normalizado, disponible: !ocupado };
  }
}
