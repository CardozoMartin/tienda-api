import { prisma } from '../../config/prisma';

// Helper del árbol de categorías cacheado en memoria.
// El árbol es GLOBAL, chico e inmutable en runtime (fuente = seed), así que lo
// cargamos una vez y respondemos descendientes/ancestros con recorridos en memoria.
// Se invalida explícitamente tras sincronizar categorías (invalidarArbolCategorias).

interface NodoPlano { id: number; padreId: number | null; rubro: string | null }

let cache: {
  hijosPorPadre: Map<number, number[]>;
  padrePorId: Map<number, number | null>;
  rubroPorId: Map<number, string | null>;
} | null = null;

async function cargar() {
  if (cache) return cache;
  const cats: NodoPlano[] = await prisma.categoria.findMany({
    select: { id: true, padreId: true, rubro: true },
  });
  const hijosPorPadre = new Map<number, number[]>();
  const padrePorId = new Map<number, number | null>();
  const rubroPorId = new Map<number, string | null>();
  for (const c of cats) {
    padrePorId.set(c.id, c.padreId ?? null);
    rubroPorId.set(c.id, c.rubro ?? null);
    if (c.padreId != null) {
      const arr = hijosPorPadre.get(c.padreId) ?? [];
      arr.push(c.id);
      hijosPorPadre.set(c.padreId, arr);
    }
  }
  cache = { hijosPorPadre, padrePorId, rubroPorId };
  return cache;
}

// Llamar tras sincronizarCategorias para que la próxima consulta recargue el árbol.
export function invalidarArbolCategorias() {
  cache = null;
}

// Devuelve el id dado + TODOS sus descendientes (N niveles). BFS sobre el árbol cacheado.
// Si la categoría es una hoja, devuelve [id] (retrocompatible con el filtro de 1 nivel).
export async function idsDescendientes(raizId: number): Promise<number[]> {
  const { hijosPorPadre } = await cargar();
  const out: number[] = [raizId];
  const cola: number[] = [raizId];
  while (cola.length) {
    const actual = cola.pop()!;
    for (const h of hijosPorPadre.get(actual) ?? []) {
      out.push(h);
      cola.push(h);
    }
  }
  return out;
}

// Devuelve la cadena de ancestros de un id (sin incluirse a sí mismo), de hijo→raíz.
export async function idsAncestros(id: number): Promise<number[]> {
  const { padrePorId } = await cargar();
  const out: number[] = [];
  let actual = padrePorId.get(id) ?? null;
  while (actual != null) {
    out.push(actual);
    actual = padrePorId.get(actual) ?? null;
  }
  return out;
}

// Rubro efectivo de una categoría = rubro de su raíz (sube por ancestros hasta la raíz).
export async function rubroDeCategoria(id: number): Promise<string | null> {
  const { padrePorId, rubroPorId } = await cargar();
  let actual: number | null = id;
  while (actual != null) {
    const padre: number | null = padrePorId.get(actual) ?? null;
    if (padre == null) return rubroPorId.get(actual) ?? null; // actual es la raíz
    actual = padre;
  }
  return null;
}
