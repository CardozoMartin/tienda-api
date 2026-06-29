import crypto from 'crypto';

const ALGORITMO = 'aes-256-gcm';

function obtenerClave(): Buffer {
  const raw = process.env['MP_ENCRYPT_KEY'];
  if (!raw || raw.length < 32) {
    throw new Error('MP_ENCRYPT_KEY debe tener al menos 32 caracteres');
  }
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

export function cifrar(texto: string): string {
  const clave = obtenerClave();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, clave, iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), cifrado.toString('hex')].join(':');
}

export function descifrar(almacenado: string): string {
  const clave = obtenerClave();
  const partes = almacenado.split(':');
  if (partes.length !== 3) throw new Error('Formato de valor cifrado inválido');
  const [ivHex, tagHex, dataHex] = partes;
  const iv      = Buffer.from(ivHex,  'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const cifrado = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITMO, clave, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8');
}

export function estacifrado(valor: string): boolean {
  const partes = valor.split(':');
  return partes.length === 3 && partes.every(p => /^[0-9a-f]+$/i.test(p));
}
