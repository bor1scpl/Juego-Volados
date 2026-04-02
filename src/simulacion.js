/* ================================================================
  simulacion.js
  Lógica pura del juego de volados — Coss Bu Ejemplo 5.1
  Tres estrategias de apuesta:
  1. Normal — doblar la apuesta al perder (libro)
  2. Conservadora — apuesta fija siempre
  3. Libre — el usuario decide (o automático: aleatorio entre base, doblar, mitad o todo)
================================================================ */

/*Resultado de un solo lanzamiento*/
function lanzar(numeroAleatorio) {
  //U < 0.5 → cara → gana | U >= 0.5 → sello → pierde
  return numeroAleatorio < 0.5;
}

/** Simula UNA corrida completa hasta llegar a la meta o quebrar.
 * @param {number}   dineroInicial  Cantidad con la que empieza
 * @param {number}   apuestaInicial Apuesta base
 * @param {number}   meta           Objetivo a alcanzar
 * @param {number[]} numeros        Secuencia de U_i disponibles
 * @param {number}   offset         Índice desde donde consumir números
 * @param {string}   estrategia     'normal' | 'conservadora' | 'libre'
 * @param {number[]} [apuestasLibres] Para estrategia libre manual
 * @returns {{ lanzamientos, dineroFinal, gano, quiebra, numerosUsados }}
 */
export function simularCorrida(
  dineroInicial, apuestaFija, meta, numeros, offset,
  estrategia, subestrategiaLibre = null
) {
  let dinero = dineroInicial;
  let apuesta = apuestaFija;  
  const lanzamientos = [];
  let idx = offset;

  while (dinero > 0 && dinero < meta && idx < numeros.length) {
    const u = numeros[idx++];
    const ganoLanz = lanzar(u);

    let apuestaReal = apuesta;
    if (estrategia === 'libre' && subestrategiaLibre === 'todo') {
      apuestaReal = dinero;
    }

    apuestaReal = Math.min(apuestaReal, dinero); //no apostar más de lo que tiene
    const dineroAntes = dinero;
    dinero = ganoLanz ? dinero + apuestaReal : dinero - apuestaReal;

    lanzamientos.push({
      numeroAleatorio: u,
      cara: ganoLanz,
      apuesta: apuestaReal,
      dineroAntes,
      dineroDespues: dinero,
      subestrategia: estrategia === 'libre' ? subestrategiaLibre : null,
    });

    // Actualizar apuesta para la siguiente ronda según estrategia
    if (estrategia === 'normal') {
      apuesta = ganoLanz ? apuestaFija : apuestaReal * 2;
    } else if (estrategia === 'conservadora') {
      apuesta = apuestaFija;
    } else {
      // Libre: la apuesta se mantiene igual
      if (subestrategiaLibre === 'todo') {
        apuesta = dinero; 
      } else {
        apuesta = apuestaFija;
      }
    }
  }

  const gano = dinero >= meta;
  const quiebra = dinero <= 0;

  return {
    lanzamientos,
    dineroFinal: dinero,
    gano,
    quiebra,
    numerosUsados: idx - offset,
  };
}

/*** Simula n corridas completas y devuelve estadísticas.
* @param {object} config
* @returns {object} resultados completos
*/
export function simularJuego(config) {
  const {
    dineroInicial,
    apuestaInicial,
    meta,
    numeros,
    estrategia,
    nCorridas,
  } = config;

  const corridas = [];
  let offset = 0;
  let totalGanadas = 0;
  let totalQuiebras = 0;

  for (let i = 0; i < nCorridas; i++) {
    if (offset >= numeros.length - 1) break;

    const corrida = simularCorrida(
      dineroInicial, apuestaInicial, meta,
      numeros, offset, estrategia
    );

    corridas.push({ numero: i + 1, ...corrida });
    offset += corrida.numerosUsados;
    if (corrida.gano)    totalGanadas++;
    if (corrida.quiebra) totalQuiebras++;
  }

  const corridasReales = corridas.length;
  const probabilidadGanancia = corridasReales > 0
    ? totalGanadas / corridasReales
    : 0;

  //Estadísticas adicionales
  const totalLanzamientos = corridas.reduce((s, c) => s + c.lanzamientos.length, 0);
  const promedioLanzPorCorrida = corridasReales > 0
    ? (totalLanzamientos / corridasReales).toFixed(2)
    : 0;
  const corrInicompletas = corridasReales - totalGanadas - totalQuiebras;

  return {
    corridas,
    corridasReales,
    totalGanadas,
    totalQuiebras,
    corInicompletas: corrInicompletas,
    probabilidadGanancia,
    totalLanzamientos,
    promedioLanzPorCorrida,
    numerosConsumidos: offset,
  };
}
