# Juego de volados — Simulación Digital

Aplicación React que simula el juego de volados (lanzamiento de moneda) con diferentes estrategias de apuesta. Basado en el ejemplo §5.1 del libro "Simulación: Un Enfoque Práctico" de Raul Coss.

## Estrategias implementadas

| # | Estrategia | Descripción |
|---|------------|-------------|
| 1 | Normal | Doblas la apuesta al perder. Al ganar, vuelves a la apuesta inicial. |
| 2 | Conservadora | Apuesta fija en cada lanzamiento sin importar el resultado. |
| 3 | Libre | El usuario elige entre base, doble, mitad o todo antes de cada corrida. |

## Parámetros de juego

- **Dinero inicial** — Cantidad con la que empiezas ($30 por defecto)
- **Apuesta inicial** — Monto base de cada apuesta ($10 por defecto)
- **Meta** — Objetivo a alcanzar para ganar la corrida ($50 por defecto)
- **Semilla X₀** — Semilla del generador GCL (período completo garantizado gracias a los parámetros)

## Generador de números aleatorios

Se utiliza un **Generador Congruencial Lineal Mixto (GCL)** con:
- `a = 1664525`
- `c = 1013904223`
- `m = 2^32` (período completo garantizado por condiciones de Hull-Dobell)

Regla de juego: `U < 0.5 → Cara → Gana` | `U ≥ 0.5 → Sello → Pierde`

## Ejecutar localmente

```bash
npm install
npm start
```

## Estructura del proyecto
src/
├── index.js          # Punto de entrada React
├── App.module.css    # Estilos con CSS Modules
├── App.jsx           # Componente principal + UI
├── simulacion.js     # Lógica de apuestas y corridas
└── generadorVolados.js # Generador GCL de números aleatorios
