/* ================================================================
   generadorVolados.js
   Genera números pseudoaleatorios únicos en [0,1) para el juego.
   Usa el Generador Congruencial Mixto (Hull-Dobell) que garantiza
   período completo = m, es decir todos los valores son distintos
   antes de repetirse.
   Parámetros estándar de Knuth: a=1664525, c=1013904223, m=2^32
================================================================ */

const A = 1664525;
const C = 1013904223;
const M = Math.pow(2, 32); // 4294967296

/**
 * Genera una secuencia de `cantidad` números pseudoaleatorios
 * únicos en [0,1) usando GCL con período completo.
 * @param {number} semilla  Semilla inicial (entero > 0)
 * @param {number} cantidad Cuántos números generar (máx recomendado: 10000)
 * @returns {{ ui: number[], semillaFinal: number }}
 */
export function generarNumerosVolados(semilla, cantidad) {
  const ui = [];
  let X = Math.floor(semilla) % M;
  if (X === 0) X = 1;

  for (let i = 0; i < cantidad; i++) {
    X = (A * X + C) % M;
    ui.push(X / M); // normalizar a [0,1)
  }

  return { ui, semillaFinal: X };
}

/**
 * Genera una semilla aleatoria basada en el timestamp actual.
 */
export function semillaAleatoria() {
  return (Date.now() % 999983) + 1; // primo grande para mejor distribución
}
