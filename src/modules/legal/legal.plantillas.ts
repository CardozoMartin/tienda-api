// Plantillas de páginas legales precargadas, autocompletadas con datos de la tienda.
// Son un punto de partida editable — no reemplazan asesoramiento legal profesional.

interface DatosTienda {
  nombre: string;
  email?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  razonSocial?: string | null;
  cuit?: string | null;
  domicilioLegal?: string | null;
}

// Bloque de identificación del vendedor, si hay datos cargados.
function bloqueVendedor(t: DatosTienda): string {
  const lineas: string[] = [];
  if (t.razonSocial) lineas.push(`Razón social: ${t.razonSocial}`);
  if (t.cuit) lineas.push(`CUIT: ${t.cuit}`);
  if (t.domicilioLegal) lineas.push(`Domicilio legal: ${t.domicilioLegal}`);
  return lineas.length ? `\n${lineas.join('\n')}` : '';
}

export function plantillaTerminos(t: DatosTienda): { titulo: string; contenido: string } {
  const contacto = t.email ? ` a través de ${t.email}` : ' a través de los canales de contacto publicados';
  const ubicacion = [t.ciudad, t.provincia].filter(Boolean).join(', ');
  const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    titulo: 'Términos y Condiciones',
    contenido: `Términos y Condiciones de ${t.nombre}
Última actualización: ${fecha}
${bloqueVendedor(t)}

1. Aceptación
Al navegar y realizar compras en esta tienda, el usuario acepta los presentes Términos y Condiciones. Si no está de acuerdo, deberá abstenerse de utilizar el sitio.

2. Productos y precios
Los precios se expresan en la moneda indicada e incluyen los impuestos correspondientes, salvo aclaración. ${t.nombre} podrá modificar precios y disponibilidad sin previo aviso. Nos esforzamos por mostrar la información de los productos de forma precisa, pero pueden existir errores tipográficos o de imagen.

3. Proceso de compra
La compra se confirma una vez recibido el pago según el medio elegido. Recibirás la confirmación${contacto}. Nos reservamos el derecho de cancelar pedidos ante errores de precio, falta de stock o sospecha de fraude, con la correspondiente devolución del importe abonado.

4. Medios de pago y envío
Los medios de pago y las formas de envío disponibles, con sus costos y plazos estimados, se detallan durante el proceso de compra. Los plazos de entrega son estimados y pueden variar por causas ajenas a la tienda.

5. Derecho de arrepentimiento
De acuerdo con el art. 34 de la Ley 24.240 de Defensa del Consumidor, el consumidor tiene derecho a revocar la compra dentro de los DIEZ (10) días corridos contados a partir de la entrega del producto o de la celebración del contrato, sin necesidad de justificar su decisión y sin penalidad alguna. El costo de devolución será asumido por ${t.nombre}. Podés ejercer este derecho mediante el Botón de arrepentimiento disponible en el sitio${contacto}.

6. Cambios y devoluciones
Para gestionar cambios o devoluciones por fallas o disconformidad, contactanos${contacto} dentro del plazo legal. El producto deberá estar en las mismas condiciones en que fue recibido, con su embalaje y etiquetas.

7. Garantía
Los productos cuentan con la garantía legal prevista por la normativa vigente de defensa del consumidor.

8. Protección de datos personales
Los datos personales que nos brindás se utilizan únicamente para gestionar tu compra y comunicarnos con vos, conforme a la Ley 25.326 de Protección de los Datos Personales. Podés solicitar el acceso, rectificación o supresión de tus datos${contacto}.

9. Propiedad intelectual
Los contenidos del sitio (imágenes, textos, logos) pertenecen a ${t.nombre} o se utilizan con autorización, y no pueden reproducirse sin consentimiento.

10. Jurisdicción
Ante cualquier conflicto serán competentes los tribunales ordinarios${ubicacion ? ` de ${ubicacion}` : ' del domicilio del vendedor'}, sin perjuicio de los derechos que la ley reconoce al consumidor.

11. Contacto
Por cualquier consulta sobre estos Términos y Condiciones podés escribirnos${contacto}.`,
  };
}

export function plantillaPrivacidad(t: DatosTienda): { titulo: string; contenido: string } {
  const contacto = t.email ? ` a través de ${t.email}` : ' a través de los canales de contacto publicados';
  const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    titulo: 'Política de Privacidad',
    contenido: `Política de Privacidad de ${t.nombre}
Última actualización: ${fecha}

En ${t.nombre} respetamos tu privacidad y protegemos tus datos personales conforme a la Ley 25.326 de Protección de los Datos Personales de la República Argentina.

1. Qué datos recopilamos
Recopilamos los datos que nos brindás al comprar o contactarnos: nombre y apellido, correo electrónico, teléfono, y datos de envío (domicilio). También podemos registrar datos de navegación (páginas visitadas, productos vistos) para mejorar tu experiencia.

2. Para qué usamos tus datos
Utilizamos tus datos únicamente para: procesar y entregar tus pedidos, comunicarnos con vos sobre tu compra, brindarte atención al cliente y, si diste tu consentimiento, enviarte novedades y promociones.

3. Con quién los compartimos
No vendemos ni cedemos tus datos a terceros. Solo los compartimos con proveedores necesarios para cumplir tu compra (empresas de envío, plataformas de pago), quienes solo acceden a la información imprescindible para prestar el servicio.

4. Conservación
Conservamos tus datos mientras exista una relación comercial y durante los plazos que la normativa exija. Luego se eliminan o anonimizan.

5. Seguridad
Aplicamos medidas de seguridad razonables para proteger tus datos contra accesos no autorizados, pérdida o alteración. Los datos sensibles (como credenciales de pago) son gestionados por las plataformas de pago y no se almacenan en nuestros servidores.

6. Tus derechos
Como titular de los datos, tenés derecho a acceder, rectificar, actualizar y solicitar la supresión de tus datos personales de forma gratuita. Para ejercerlos, escribinos${contacto}.
La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, órgano de control de la Ley 25.326, tiene la atribución de atender denuncias y reclamos relativos al incumplimiento de las normas sobre protección de datos personales.

7. Consentimiento
Al utilizar este sitio y brindarnos tus datos, prestás tu consentimiento para el tratamiento descripto en esta política.

8. Contacto
Ante cualquier consulta sobre el tratamiento de tus datos podés escribirnos${contacto}.`,
  };
}

export function plantillaCambios(t: DatosTienda): { titulo: string; contenido: string } {
  const contacto = t.email ? ` a través de ${t.email}` : ' a través de los canales de contacto publicados';
  const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    titulo: 'Cambios y Devoluciones',
    contenido: `Política de Cambios y Devoluciones de ${t.nombre}
Última actualización: ${fecha}

1. Derecho de arrepentimiento
Podés arrepentirte de tu compra dentro de los DIEZ (10) días corridos desde que recibís el producto, sin necesidad de justificar tu decisión y sin costo alguno (art. 34, Ley 24.240). El costo de devolución corre por cuenta de ${t.nombre}. Para ejercerlo, usá el Botón de arrepentimiento del sitio o escribinos${contacto}.

2. Cambios por talle, color o preferencia
Aceptamos cambios dentro de los [completar: ej. 30] días de recibido el producto, siempre que esté sin uso, en perfecto estado, con su etiqueta y embalaje original. El cliente coordina el envío para el cambio, salvo que se trate de un error nuestro.

3. Devoluciones por falla o defecto
Si el producto presenta una falla de fabricación, contactanos${contacto} y gestionaremos la reparación, el cambio o la devolución del importe, según corresponda, conforme a la garantía legal.

4. Cómo iniciar un cambio o devolución
Escribinos${contacto} indicando tu número de pedido y el motivo. Te responderemos con los pasos a seguir y la dirección o método para el envío del producto.

5. Reintegros
Una vez recibido y verificado el producto, procesaremos el reintegro por el mismo medio de pago utilizado en la compra, dentro de los plazos que correspondan según el medio.

6. Excepciones
Por razones de higiene o naturaleza del producto, algunos artículos pueden no admitir cambio (por ejemplo, ropa interior o trajes de baño), salvo defecto de fabricación. Estas excepciones se aclaran en la descripción del producto.

7. Contacto
Para cualquier consulta sobre cambios y devoluciones, escribinos${contacto}.`,
  };
}
