import React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { FaPlay, FaSync, FaSignOutAlt, FaUndo, FaCoins, FaAngleLeft } from 'react-icons/fa';
import { GiCoinflip, GiMoneyStack, GiTargetPrize } from 'react-icons/gi';
import { BiTrendingUp, BiTrendingDown, BiDollar } from 'react-icons/bi';
import { generarNumerosVolados, semillaAleatoria } from './generadorVolados';
import { simularCorrida } from './simulacion';
import styles from './App.module.css';

//Constantes
const ESTRATEGIAS = [
  { id: 'normal',   nombre: 'Normal',   icono: '×2', desc: 'Doblas la apuesta al perder. Al ganar, vuelves a la apuesta inicial.' },
  { id: 'conservadora', nombre: 'Conservadora', icono: '=',  desc: 'Apuesta fija en cada lanzamiento sin importar el resultado.' },
  { id: 'libre',        nombre: 'Libre',        icono: '?',  desc: 'Automático: elige entre base, doble, mitad o apostar todo.' },
];

const FASE = { SETUP: 'setup', JUGANDO: 'jugando', INFORME: 'informe' };

//Helper para calcular estadísticas a mostrar en el informe final
function calcStats(corridas, dineroInicial) {
  const total    = corridas.length;
  const ganadas  = corridas.filter(c => c.gano).length;
  const quiebras = corridas.filter(c => c.quiebra).length;
  const prob     = total > 0 ? (ganadas / total) * 100 : 0;
  const totalLanz= corridas.reduce((s, c) => s + c.lanzamientos.length, 0);
  const promLanz = total > 0 ? (totalLanz / total).toFixed(1) : 0;
  const neta     = corridas.reduce((s, c) => s + (c.dineroFinal - dineroInicial), 0);
  return { total, ganadas, quiebras, prob, totalLanz, promLanz, neta };
}

//Componentes pequeños para UI
function Badge({ ok, neutro, children }) {
  return (
    <span className={`${styles.badge} ${neutro ? styles.badgeGris : ok ? styles.badgeVerde : styles.badgeRojo}`}>
      {children}
    </span>
  );
}

function Moneda({ cara }) {
  return (
    <div className={`${styles.moneda} ${cara ? styles.monedaCara : styles.monedaSello}`}>
      {cara ? (
        <GiCoinflip style={{ fontSize: '24px', color: 'var(--verde)' }} />
      ) : (
        <GiCoinflip style={{ fontSize: '24px', color: 'var(--rojo)', transform: 'rotate(180deg)' }} />
      )}
    </div>
  );
}

function StatBox({ label, value, color, sub }) {
  return (
    <div className={`${styles.statBox} ${color ? styles[color] : ''}`}>
      <div className={styles.statVal}>{value}</div>
      <div className={styles.statLbl}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

//Fase setup: configuración inicial del juego
function PanelSetup({ onIniciar }) {
  const [estrategia, setEstrategia] = useState('normal');
  const [dinero,  setDinero]  = useState(30);
  const [apuesta, setApuesta] = useState(10);
  const [meta,    setMeta]    = useState(50);
  const [semilla, setSemilla] = useState(() => semillaAleatoria());
  const valido = dinero > 0 && apuesta > 0 && apuesta <= dinero && meta > dinero && semilla > 0;

  const restaurarValoresPorDefecto = () => {
    setDinero(30);
    setApuesta(10);
    setMeta(50);
  };

  return (
    <div className={styles.setupWrap}>
      <div className={styles.setupBg} />

      <div className={styles.setupHeader}>
        <div className={styles.setupEmoji}>🪙</div>
        <h1 className={styles.setupTitulo}>Juego de volados</h1>
        <p className={styles.setupSub}>Desarrolladores · Boris Bello y Sofhia Prasca</p>
        <p className={styles.setupSub}>Simulación Digital · Ejemplo §5.1</p>
      </div>

      <div className={styles.setupGrid}>

        {/* Tarjeta 1 */}
        <div className={styles.sCard}>
          <div className={styles.sCardHead}><span className={styles.sNum}>01</span> Estrategia de apuesta</div>
          <div className={styles.sCardBody}>
            {ESTRATEGIAS.map(e => (
              <label key={e.id} className={`${styles.estOpt} ${estrategia === e.id ? styles.estActiva : ''}`}>
                <input type="radio" name="est" value={e.id} checked={estrategia === e.id}
                  onChange={() => setEstrategia(e.id)} style={{ display: 'none' }} />
                <span className={`${styles.estIcn} ${estrategia === e.id ? styles.estIcnActivo : ''}`}>{e.icono}</span>
                <div>
                  <div className={styles.estNombre}>{e.nombre}</div>
                  <div className={styles.estDesc}>{e.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Tarjeta 2 */}
        <div className={styles.sCard}>
          <div className={styles.sCardHead}>
            <span className={styles.sNum}>02</span> Tu dinero y apuesta
            <button 
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
              onClick={restaurarValoresPorDefecto}
              title="Restaurar valores por defecto (30, 10, 50)"
              style={{ marginLeft: 'auto', padding: '4px 8px' }}
            >
              <FaUndo style={{ fontSize: '12px', marginRight: '4px' }} /> Por defecto
            </button>
          </div>
          <div className={styles.sCardBody}>
            {[
              { label: 'Dinero inicial ($)', hint: '¿con cuánto entras al juego?', val: dinero, set: setDinero, min: 1, icon: <BiDollar size={16} style={{ marginRight: '4px', color: 'var(--verde)' }} /> },
              { label: 'Apuesta inicial ($)', hint: `debe ser ≤ $${dinero}`, val: apuesta, set: setApuesta, min: 1, max: dinero, icon: <GiMoneyStack size={16} style={{ marginRight: '4px', color: 'var(--verde)' }} /> },
              { label: 'Meta ($)', hint: 'objetivo a alcanzar (por defecto $50)', val: meta, set: setMeta, min: dinero + 1, icon: <GiTargetPrize size={16} style={{ marginRight: '4px', color: 'var(--verde)' }} /> },
            ].map(({ label, hint, val, set, min, max, icon }) => (
              <div key={label} className={styles.campo}>
                <label className={styles.campoLbl}>
                  {icon}
                  {label}
                  <span className={styles.campoHint}>{hint}</span>
                </label>
                <input 
                  type="number" 
                  className={styles.inp} 
                  value={val === 0 ? '' : val}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      set(0);
                    } else {
                      const num = Number(raw);
                      if (!isNaN(num)) {
                        let nuevoValor = num;
                        if (min !== undefined && nuevoValor < min) nuevoValor = min;
                        if (max !== undefined && nuevoValor > max) nuevoValor = max;
                        set(nuevoValor);
                      }
                    }
                  }}
                  min={min}
                  max={max}
                />
              </div>
            ))}
            {!valido && (
              <div className={styles.avisoErr}>
                {apuesta > dinero && '⚠ Apuesta no puede superar el dinero inicial. '}
                {meta <= dinero && '⚠ La meta debe ser mayor que el dinero inicial.'}
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta 3 */}
        <div className={styles.sCard}>
          <div className={styles.sCardHead}><span className={styles.sNum}>03</span> Números aleatorios</div>
          <div className={styles.sCardBody}>
            <div className={styles.campo}>
              <label className={styles.campoLbl}>
                Semilla X₀
                <span className={styles.campoHint}>GCL · a=1664525 · c=1013904223 · m=2^32</span>
              </label>
              <div className={styles.inpRow}>
                <input type="number" className={styles.inp} value={semilla}
                  onChange={e => setSemilla(Math.max(1, Number(e.target.value)))} min={1} />
                <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                  onClick={() => setSemilla(semillaAleatoria())} title="Semilla aleatoria">
                  <FaSync style={{ fontSize: '12px' }} />
                </button>
              </div>
            </div>
            <div className={styles.infoBox}>
              <strong>Período completo garantizado.</strong> El GCL, para este caso, genera 2^32 valores distintos antes de repetirse (condiciones Hull-Dobell).
              <br /><br />
              <GiCoinflip style={{ fontSize: '30px', marginRight: '4px', color: 'var(--verde)' }} />
              U &lt; 0.5 → Cara → <span style={{ color: 'var(--verde)' }}>Gana</span>
              <br />
              <GiCoinflip style={{ fontSize: '30px', marginRight: '4px', color: 'var(--rojo)', transform: 'rotate(180deg)' }} />
              U ≥ 0.5 → Sello → <span style={{ color: 'var(--rojo)' }}>Pierde</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.setupAccion}>
        <button className={`${styles.btn} ${styles.btnOro} ${styles.btnXL}`}
          disabled={!valido}
          onClick={() => onIniciar({ estrategia, dinero, apuesta, meta, semilla })}>
          <FaPlay style={{ marginRight: '8px', fontSize: '14px' }} /> Comenzar juego
        </button>
        {!valido && <p className={styles.setupValidMsg}>Corrige los parámetros para continuar</p>}
      </div>
    </div>
  );
}

//Fase juego: aquí ocurre la magia de simular cada corrida, mostrar resultados y permitir al usuario decidir cuándo abandonar para ver el informe final
function PanelJuego({ config, onAbandonar, offsetInicial = 0, numerosIniciales = null }) {
  const { estrategia, dinero, apuesta, meta, semilla } = config;

  const numerosRef = useRef(null);
  const offsetRef  = useRef(offsetInicial);

  if (!numerosRef.current) {
    if (numerosIniciales) {
      numerosRef.current = numerosIniciales;
    } else {
      numerosRef.current = generarNumerosVolados(semilla, 10000).ui;
    }
  }
  const [corridas,    setCorridas]   = useState([]);
  const [corrActual,  setCorrActual] = useState(null);
  const [autoRun,     setAutoRun]    = useState(false);
  const autoRef = useRef(false);
  const corridasRef = useRef([]);
  const ultimaRef   = useRef(null);

  //Solo para estrategia libre: subestrategia elegida por el usuario
  const [subLibre, setSubLibre] = useState('base');

  const lanzarCorrida = useCallback(() => {
    //Calcular la apuesta para toda la corrida según la subestrategia elegida
    let apuestaCorrida = apuesta; //valor por defecto (base)

    if (estrategia === 'libre') {
      const dineroActual = corridasRef.current.length === 0 
        ? dinero 
        : corridasRef.current[corridasRef.current.length - 1].dineroFinal;

      switch (subLibre) {
        case 'base':
          apuestaCorrida = apuesta;
          break;
        case 'doble':
          apuestaCorrida = apuesta * 2;
          break;
        case 'mitad':
          apuestaCorrida = Math.max(1, Math.floor(apuesta / 2));
          break;
        case 'todo':
          apuestaCorrida = dineroActual;
          break;
        default:
          apuestaCorrida = apuesta;
      }
    }

    const res = simularCorrida(
      dinero, 
      apuestaCorrida,
      meta, 
      numerosRef.current, 
      offsetRef.current, 
      estrategia,
      subLibre 
    );
    
    offsetRef.current += res.numerosUsados;
    const nueva = { numero: corridasRef.current.length + 1, ...res };
    corridasRef.current = [...corridasRef.current, nueva];
    setCorridas([...corridasRef.current]);
    setCorrActual(nueva);
    return nueva;
  }, [dinero, apuesta, meta, estrategia, subLibre]);

  const MAX_CORRIDAS = 300;
  const BLOQUE = 100;

  const handleAuto = useCallback(async () => {
    setAutoRun(true);
    autoRef.current = true;
    const corridasActuales = corridasRef.current.length;
    const metaSiguiente = Math.min(
      Math.ceil((corridasActuales + 1) / BLOQUE) * BLOQUE,
      MAX_CORRIDAS
    );

    while (corridasRef.current.length < metaSiguiente && autoRef.current) {
      lanzarCorrida(null);
      await new Promise(r => setTimeout(r, 100));
    }

    setAutoRun(false);
    autoRef.current = false;
  }, [lanzarCorrida]);

  const handlePararAuto = () => { autoRef.current = false; setAutoRun(false); };

  useEffect(() => {
    if (ultimaRef.current) ultimaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [corridas.length]);

  const stats = calcStats(corridas, dinero);
  const estNombre = ESTRATEGIAS.find(e => e.id === estrategia)?.nombre || estrategia;

  return (
    <div className={styles.juegoWrap}>

      {/*Topbar*/}
      <header className={styles.juegoTop}>
        <div className={styles.juegoTopL}>
          <FaCoins style={{ fontSize: '28px', color: 'var(--oro)' }} />
          <div>
            <div className={styles.juegoTitulo}>Juego de volados</div>
            <div className={styles.juegoSub}>
              <strong>{estNombre}</strong> · Meta <strong>${meta}</strong> · Inicio <strong>${dinero}</strong>
            </div>
          </div>
        </div>
        {corridas.length > 0 && (
          <div className={styles.juegoProb}>
            <span className={styles.probLbl}>P(Ganancia)</span>
            <span className={`${styles.probVal} ${stats.prob >= 50 ? styles.verde : styles.rojo}`}>
              {stats.prob.toFixed(1)}%
            </span>
          </div>
        )}
      </header>

      <div className={styles.juegoBody}>

        {/*Sidebar controles*/}
        <aside className={styles.juegoSide}>
          {corridas.length > 0 && (
            <div className={styles.miniStats}>
              <StatBox label="Corridas" value={stats.total} />
              <StatBox label="Ganadas"  value={stats.ganadas}  color="boxVerde" />
              <StatBox label="Quiebras" value={stats.quiebras} color="boxRojo" />
            </div>
          )}
            {estrategia === 'libre' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 10, 
                  color: 'var(--slate-400)', 
                  marginBottom: 10, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  textAlign: 'center'
                }}>
                  Apuesta para corrida #{corridas.length + 1}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { id: 'base',  label: 'Base',   icon: <BiDollar size={14} />, color: '#22c55e', bgHover: 'rgba(34,197,94,0.15)' },
                    { id: 'doble', label: 'Doble',  icon: <BiTrendingUp size={14} />, color: '#f59e0b', bgHover: 'rgba(245,158,11,0.15)' },
                    { id: 'mitad', label: 'Mitad',  icon: <BiTrendingDown size={14} />, color: '#3b82f6', bgHover: 'rgba(59,130,246,0.15)' },
                    { id: 'todo',  label: 'Todo',   icon: <GiMoneyStack size={14} />, color: '#ef4444', bgHover: 'rgba(239,68,68,0.15)' },
                  ].map(op => {
                    const isActive = subLibre === op.id;
                    return (
                      <button
                        key={op.id}
                        onClick={() => setSubLibre(op.id)}
                        disabled={autoRun}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 8px',
                          borderRadius: '10px',
                          border: isActive ? `1px solid ${op.color}` : '1px solid var(--slate-600)',
                          background: isActive ? op.bgHover : 'rgba(255,255,255,0.02)',
                          color: isActive ? op.color : 'var(--slate-300)',
                          cursor: autoRun ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px',
                          fontWeight: isActive ? 700 : 500,
                          transition: 'all 0.2s ease',
                          opacity: autoRun ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!autoRun && !isActive) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'var(--slate-500)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!autoRun && !isActive) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'var(--slate-600)';
                          }
                        }}
                      >
                        <span style={{ fontSize: '16px', color: isActive ? op.color : 'var(--slate-400)' }}>{op.icon}</span>
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          <div className={styles.ctrlCard}>
          <button className={`${styles.btn} ${styles.btnOro} ${styles.btnFull}`}
            onClick={lanzarCorrida} disabled={autoRun || corridas.length >= 300}>
            <FaPlay style={{ marginRight: '8px' }} /> Jugar corrida #{corridas.length + 1}
          </button>

          {!autoRun
            ? <button className={`${styles.btn} ${styles.btnAzul} ${styles.btnFull}`} onClick={handleAuto}>
                <FaSync style={{ marginRight: '8px' }} /> Automático (cada 100)
              </button>
            : <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`} onClick={handlePararAuto}>
                ⏹ Detener
              </button>
          }

          <button className={`${styles.btn} ${styles.btnRojo} ${styles.btnFull}`}
            onClick={() => onAbandonar(corridas, offsetRef.current, numerosRef.current)}>
            <FaSignOutAlt style={{ marginRight: '8px' }} /> Abandonar · Ver informe
          </button>
          </div>
          <div className={styles.reglaBox}>
            <div><GiCoinflip style={{ fontSize: '22px', marginRight: '6px', color: 'var(--verde)' }} /> Cara (U &lt; 0.5) → <span className={styles.verde}>Gana</span></div>
            <div><GiCoinflip style={{ fontSize: '22px', marginRight: '6px', color: 'var(--rojo)', transform: 'rotate(180deg)' }} /> Sello (U ≥ 0.5) → <span className={styles.rojo}>Pierde</span></div>
            <div style={{ marginTop: 8, color: 'var(--oro)', fontSize: 11 }}>
              {estrategia === 'normal'   && '×2 al perder · base al ganar'}
              {estrategia === 'conservadora' && `Apuesta fija $${apuesta}`}
              {estrategia === 'libre' && `Corrida #${corridas.length + 1}: apostando ${subLibre}`}
            </div>
          </div>
        </aside>

        {/*Main: corrida actual + historial*/}
        <div className={styles.juegoMain}>

          {corrActual ? (
            <div className={`${styles.corrActual} ${corrActual.gano ? styles.corrGano : corrActual.quiebra ? styles.corrQuiebra : styles.corrNormal}`}>
              <div className={styles.corrHead}>
                <span className={styles.corrNum}>Corrida #{corrActual.numero}</span>
                {corrActual.gano
                  ? <Badge ok>✓ Llegó a la meta</Badge>
                  : corrActual.quiebra
                    ? <Badge>✗ Quiebra</Badge>
                    : <Badge neutro>Sin resultado definitivo</Badge>}
                <span className={styles.corrFinal}>Final: <strong>${corrActual.dineroFinal}</strong></span>
              </div>
              <div className={styles.lanzGrid}>
                {corrActual.lanzamientos.map((l, i) => (
                  <div key={i} className={`${styles.lanzT} ${l.cara ? styles.lGano : styles.lPierde}`}>
                    <div className={styles.lIdx}>#{i+1}</div>
                    <Moneda cara={l.cara} />
                    <div className={styles.lData}>
                      <span className={`${styles.lRes} ${l.cara ? styles.verde : styles.rojo}`}>
                      
                      {l.cara ? 'CARA' : 'SELLO'}
                      </span>
                      <span className={styles.lAp}>Ap. ${l.apuesta}</span>
                      <span className={styles.lMov}>${l.dineroAntes} → ${l.dineroDespues}</span>
                      <span className={styles.lU}>U={l.numeroAleatorio.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <div className={styles.plEmoji}>🪙</div>
              <p>Presiona <strong>jugar corrida</strong> para comenzar</p>
            </div>
          )}
          {corridas.length > 1 && (
            <div className={styles.historial}>
              <div className={styles.histTit}>Historial (clic para ver detalle)</div>
              <div className={styles.histLista}>
                {corridas.slice(0, -1).map((c, i) => (
                  <div key={i}
                    ref={i === corridas.length - 2 ? ultimaRef : null}
                    className={`${styles.histItem} ${c.gano ? styles.hGano : c.quiebra ? styles.hQuiebra : styles.hNeutro}`}
                    onClick={() => setCorrActual(c)}  
                    style={{ cursor: 'pointer' }}     
                  >
                    <span className={styles.hN}>#{c.numero}</span>
                    <span>{c.lanzamientos.length} lanz.</span>
                    <span>${c.dineroFinal}</span>
                    <span>{c.gano ? '✓' : c.quiebra ? '✗' : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

//Fase informe: aquí se muestra un resumen de todas las corridas jugadas, con estadísticas clave y la posibilidad de revisar cada corrida
function PanelInforme({ corridas, config, offset, numeros, onReiniciar, onContinuar }) {
  const { estrategia, dinero, meta } = config;
  const stats = calcStats(corridas, dinero);
  const estNombre = ESTRATEGIAS.find(e => e.id === estrategia)?.nombre || estrategia;
  const pct = stats.prob.toFixed(1);
  const [verCorrida, setVerCorrida] = useState(null);

  return (
    <div className={styles.informeWrap}>

      <div className={styles.infHeader}>
        <div>
          <div className={styles.infTitulo}>Informe final</div>
          <div className={styles.infSub}>{stats.total} corridas · {estNombre} · Meta ${meta} · Inicio ${dinero}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={`${styles.btn} ${styles.btnAzul}`} onClick={onContinuar}>
            <FaAngleLeft style={{ marginRight: '8px' }} /> Continuar jugando
          </button>
          <button className={`${styles.btn} ${styles.btnOro}`} onClick={onReiniciar}>
            <FaUndo style={{ marginRight: '8px' }} /> Nuevo juego
          </button>
        </div>
      </div>

      <div className={styles.probBloque}>
        <div className={`${styles.probGrande} ${parseFloat(pct) >= 50 ? styles.verde : styles.rojo}`}>{pct}%</div>
        <div className={styles.probLabel}>Probabilidad de ganancia</div>
        <p className={styles.probDesc}>
          En <strong>{stats.total}</strong> corridas con estrategia <em>{estNombre}</em>,
          se llegó a la meta de <strong>${meta}</strong> en <strong>{stats.ganadas}</strong> ocasiones
          {stats.quiebras > 0 && <>, con <strong>{stats.quiebras}</strong> quiebras</>}.
        </p>
      </div>

      <div className={styles.infStatsGrid}>
        <StatBox label="Corridas jugadas" value={stats.total} />
        <StatBox label="Llegaron a la meta" value={stats.ganadas} color="boxVerde"
          sub={`${((stats.ganadas / stats.total) * 100).toFixed(1)}%`} />
        <StatBox label="Quiebras" value={stats.quiebras} color="boxRojo"
          sub={`${((stats.quiebras / stats.total) * 100).toFixed(1)}%`} />
        <StatBox label="Total lanzamientos" value={stats.totalLanz} />
        <StatBox label="Prom. lanz./corrida" value={stats.promLanz} />
        <StatBox label="Ganancia neta total"
          value={`${stats.neta >= 0 ? '+' : ''}$${stats.neta}`}
          color={stats.neta >= 0 ? 'boxVerde' : 'boxRojo'} />
      </div>

      <div className={styles.infTablaWrap}>
        <div className={styles.infTablaHead}>
          Detalle por corrida
          <span className={styles.infTablaHint}>Clic para ver lanzamientos</span>
        </div>
        <div className={styles.tablaScroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>#</th>
                <th>Lanzamientos</th>
                <th>Dinero final</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {corridas.map(c => (
                <React.Fragment key={c.numero}>
                  <tr
                    className={`${styles.filaC} ${verCorrida === c.numero ? styles.filaActiva : ''}`}
                    onClick={() => setVerCorrida(verCorrida === c.numero ? null : c.numero)}>
                    <td className={styles.tdN}>{c.numero}</td>
                    <td className={styles.tdC}>{c.lanzamientos.length}</td>
                    <td className={styles.tdC}>${c.dineroFinal}</td>
                    <td>{c.gano ? <Badge ok>✓ META</Badge> : c.quiebra ? <Badge>✗ QUIEBRA</Badge> : <Badge neutro>—</Badge>}</td>
                  </tr>
                  {verCorrida === c.numero && (
                    <tr className={styles.filaDetalle}>
                      <td colSpan={4}>
                        <div className={styles.detInline}>
                          {c.lanzamientos.map((l, i) => (
                            <span key={i} className={`${styles.lInline} ${l.cara ? styles.verde : styles.rojo}`}>
                              #{i + 1}
                              {l.cara ? (
                                <GiCoinflip style={{ margin: '0 4px', fontSize: '20px' }} />
                              ) : (
                                <GiCoinflip style={{ margin: '0 4px', fontSize: '20px', transform: 'rotate(180deg)' }} />
                              )}
                              ${l.dineroAntes} → ${l.dineroDespues} (U={l.numeroAleatorio.toFixed(3)})
                              {estrategia === 'libre' && l.subestrategia && (
                                <span style={{
                                  marginLeft: '6px',
                                  padding: '2px 6px',
                                  background: 'rgba(245,158,11,0.2)',
                                  borderRadius: '4px',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  fontFamily: 'monospace'
                                }}>
                                  {l.subestrategia === 'base' && 'BASE'}
                                  {l.subestrategia === 'doble' && 'DOBLE'}
                                  {l.subestrategia === 'mitad' && 'MITAD'}
                                  {l.subestrategia === 'todo' && 'TODO'}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
//Root del componente: maneja la transición entre fases (setup, juego, informe) y mantiene el estado global necesario para compartir entre ellas
export default function App() {
  const [fase,    setFase]    = useState(FASE.SETUP);
  const [config,  setConfig]  = useState(null);
  const [corridas,setCorridas]= useState([]);
  const [offsetJuego, setOffsetJuego] = useState(0);  
  const [numerosGuardados, setNumerosGuardados] = useState(null); 

  if (fase === FASE.SETUP)
    return <PanelSetup onIniciar={cfg => { setConfig(cfg); setFase(FASE.JUGANDO); }} />;
  if (fase === FASE.JUGANDO)
    return <PanelJuego 
      config={config} 
      onAbandonar={(cors, offset, numeros) => { 
        setCorridas(cors); 
        setOffsetJuego(offset);
        setNumerosGuardados(numeros);
        setFase(FASE.INFORME); 
      }} 
      offsetInicial={offsetJuego}
      numerosIniciales={numerosGuardados}
    />;
  if (fase === FASE.INFORME)
    return <PanelInforme 
      corridas={corridas} 
      config={config}
      offset={offsetJuego}
      numeros={numerosGuardados}
      onReiniciar={() => { setFase(FASE.SETUP); setConfig(null); setCorridas([]); setOffsetJuego(0); setNumerosGuardados(null); }}
      onContinuar={() => { setFase(FASE.JUGANDO); }}
    />;
  return null;
}
