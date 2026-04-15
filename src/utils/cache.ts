import NodeCache from 'node-cache';
import { logger } from './logger';

// Instanciamos el cache con un estándar (stdTTL) de 5 min globales
// checkperiod: Cada cuánto se limpia la memoria buscando llaves expiradas
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

class CacheService {
  /**
   * Obtiene un valor de la caché.
   */
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  }

  /**
   * Guarda un valor en la caché.
   * `ttl` es opcional. Si no se pasa, usa el stdTTL configurado arriba.
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  }

  /**
   * Elimina una clave o un arreglo de claves de la caché.
   */
  del(keys: string | string[]): number {
    return cache.del(keys);
  }

  /**
   * Elimina todas las claves que comiencen con el prefijo indicado.
   * Útil para purgar por tienda (ej. "tienda_1_*")
   */
  flushPrefix(prefix: string): void {
    const keys = cache.keys();
    const keysToDelete = keys.filter((k) => k.startsWith(prefix));
    
    if (keysToDelete.length > 0) {
      this.del(keysToDelete);
      logger.debug(`[CACHE] Purgados ${keysToDelete.length} items con prefijo '${prefix}'`);
    }
  }

  /**
   * Vacía toda la caché.
   */
  flushAll(): void {
    cache.flushAll();
    logger.debug('[CACHE] Caché vaciada completamente');
  }
}

export const cacheService = new CacheService();
