// --- Construye el FeatureCollection final a partir de los ids que cumplen
// AMBOS filtros (régimen exacto + al menos UNA de las categorías marcadas).
// Si no hay categorías marcadas, se interpreta como "todas". ---
function buildData(regimen, categoriasSeleccionadas) {
  const idsRegimen = new Set(regimenIndex[regimen] || []);

  let idsCategoria;
  if (categoriasSeleccionadas.length === 0) {
    idsCategoria = null; // sin restricción de categoría
  } else {
    idsCategoria = new Set();
    for (const cat of categoriasSeleccionadas) {
      for (const id of (categoriaIndex[cat] || [])) idsCategoria.add(id);
    }
  }

  const features = [];
  for (const id of idsRegimen) {
    if (idsCategoria === null || idsCategoria.has(id)) {
      features.push(allFeaturesById[id]);
    }
  }
  return {type: "FeatureCollection", features};
}

// --- Actualiza el contador de parcelas visibles ---
function updateControlsUI(regimen, categoriasSeleccionadas, visibleCount) {
  const parts = [];
  if (regimen !== "TODOS") parts.push(`régimen <b>${regimen}</b>`);
  if (categoriasSeleccionadas.length > 0) parts.push(`tipo <b>${categoriasSeleccionadas.join(", ")}</b>`);

  const counter = document.getElementById("parcel-count");
  counter.innerHTML = parts.length === 0
    ? `Mostrando <b>${visibleCount}</b> parcelas (sin filtros)`
    : `Mostrando <b>${visibleCount}</b> parcelas — ${parts.join(" · ")}`;
}

// --- Tooltip de centros: pestaña activa de la ficha de HOVER (se recuerda
// entre renders) y del panel FIJADO por clic (independiente: pueden mostrar
// pestañas distintas a la vez). ---
let centroTooltipTab = "desc";
let pinTooltipTab = "desc";

function selectCentroTab(tabId) {
  centroTooltipTab = tabId;
  const container = document.getElementById("centro-tooltip");
  if (!container) return;
  container.querySelectorAll(".centro-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  container.querySelectorAll(".centro-tab-panel").forEach(panel => {
    panel.style.display = (panel.dataset.tab === tabId) ? "" : "none";
  });
}

function selectPinTab(tabId) {
  pinTooltipTab = tabId;
  renderPinnedCentroPanel();
}

// --- Fila de una tabla de aulas prefabricadas (tamaño | normal | especial) ---
function filaAula(label, normal, especial) {
  return `<tr>
    <td style="padding:2px 0; color:#8695a7;">${label}</td>
    <td style="text-align:right; font-weight:600;">${normal ?? 0}</td>
    <td style="text-align:right; font-weight:600;">${especial ?? 0}</td>
  </tr>`;
}

// --- Contenido de las 3 pestañas de un centro (compartido por la ficha de
// hover y el panel fijado por clic) ---
function panelDescHtml(p) {
  return `
    <table style="width:100%; border-collapse: collapse; font-size: 13px; color:#1e2b38;">
        <tr><td style="padding:3px 0; color:#8695a7;">ID centro</td><td style="text-align:right; font-weight:600;">${p.codCentro ?? ""}</td></tr>
        <tr><td style="padding:3px 0; color:#8695a7;">REFCAT</td><td style="text-align:right; font-weight:600;">${p.refcat ?? ""}</td></tr>
        <tr><td style="padding:3px 0; color:#8695a7;">Régimen</td><td style="text-align:right; font-weight:600;">${p.regimen ?? ""}</td></tr>
        <tr><td style="padding:3px 0; color:#8695a7;">Tipo educativo</td><td style="text-align:right; font-weight:600;">${p.tipoEducacion ?? ""}</td></tr>
        <tr><td style="padding:3px 0; color:#8695a7;">Categorías</td><td style="text-align:right; font-weight:600;">${(p.categoriasEducativas || []).join(", ")}</td></tr>
        <tr><td style="padding:3px 0; color:#8695a7;">Uso</td><td style="text-align:right; font-weight:600;">${p.uso_label ?? ""}</td></tr>
        <tr><td style="padding:3px 0; color:#8695a7;">Área / Altura</td><td style="text-align:right; font-weight:600;">${p.area ?? ""} m² · ${p.LIDAR_HMEAN_EDF ?? ""} m</td></tr>
        <tr><td style="padding:3px 0; color:#8695a7;">Fecha construcción</td><td style="text-align:right; font-weight:600;">${p.FECHA ?? ""}</td></tr>
    </table>
  `;
}

function panelUnidadesHtml(p) {
  const uaTotal = Number(p.uaTotal) || 0;
  const aulasTotal = Number(p.aulasTotal) || 0;
  const ratioPrefab = uaTotal > 0 ? (aulasTotal / uaTotal) * 100 : null;
  const ratioTxt = ratioPrefab === null ? "N/D" : `${ratioPrefab.toFixed(1)}%`;

  return `
    <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin-bottom:4px;">UNIDADES TOTALES</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; font-size:12.5px; color:#1e2b38; background:#f7f9fa; border-radius:6px; padding:8px; margin-bottom:10px;">
        <div>Autorizadas <b style="float:right;">${p.uaTotal ?? ""}</b></div>
        <div>Habilitadas <b style="float:right;">${p.uhTotal ?? ""}</b></div>
        <div>Sin func. <b style="float:right;">${p.unfTotal ?? ""}</b></div>
        <div style="color:#1e8449;">Activas <b style="float:right;">${p.uaAct ?? ""}</b></div>
    </div>

    <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin-bottom:4px;">AULAS PREFABRICADAS</div>
    <table style="width:100%; border-collapse: collapse; font-size: 12px; color:#1e2b38; margin-bottom:6px;">
        <tr style="color:#8695a7; font-size:10.5px;"><td></td><td style="text-align:right;">NORMAL</td><td style="text-align:right;">ESPECIAL</td></tr>
        ${filaAula("15 m²", p.aula15N, p.aula15E)}
        ${filaAula("30 m²", p.aula30N, p.aula30E)}
        ${filaAula("45 m²", p.aula45N, p.aula45E)}
        ${filaAula("60 m²", p.aula60N, p.aula60E)}
        ${filaAula("90 m²", p.aula90N, p.aula90E)}
        ${filaAula("135 m²", p.aula135N, p.aula135E)}
        ${filaAula("150 m²", p.aula150N, p.aula150E)}
    </table>
    <!-- No se cuentan los aseos (no son aulas) ni las de uso especial (son
    un subtipo, se ven arriba desagregadas) en el total ni en el ratio. -->
    <div style="display:flex; justify-content:space-between; align-items:center; background:#f7f9fa; border-radius:6px; padding:8px; font-size:12.5px;">
        <div>Total aulas prefab. (normal) <b>${p.aulasTotal ?? 0}</b></div>
        <div>Ratio s/ unidades <b>${ratioTxt}</b></div>
    </div>
  `;
}

function panelPuestosHtml(p) {
  return `
    <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin-bottom:4px;">PUESTOS ESCOLARES</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; font-size:12.5px; color:#1e2b38; background:#f7f9fa; border-radius:6px; padding:8px; margin-bottom:10px;">
        <div>Autorizados <b style="float:right;">${p.paTotal ?? ""}</b></div>
        <div>Habilitados <b style="float:right;">${p.phTotal ?? ""}</b></div>
        <div>Sin func. <b style="float:right;">${p.pnfTotal ?? ""}</b></div>
        <div style="color:#1e8449;">Activos <b style="float:right;">${p.paAct ?? ""}</b></div>
    </div>

    <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin-bottom:4px;">MATRICULACIONES POR ETAPA</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; font-size:12px; color:#1e2b38;">
        <div>Ed. Infantil <b style="float:right;">${p.matEi ?? ""}</b></div>
        <div>Ed. Primaria <b style="float:right;">${p.matEp ?? ""}</b></div>
        <div>ESO <b style="float:right;">${p.matEso ?? ""}</b></div>
        <div>Bachiller <b style="float:right;">${p.matBach ?? ""}</b></div>
    </div>
  `;
}

// --- Ficha de HOVER: se ve mientras el cursor está sobre el centro, con un
// pie que recuerda que se puede hacer clic para fijarla. ---
function tooltipHtmlCentro(p) {
  const tab = centroTooltipTab;
  const vis = (id) => (tab === id ? "" : "display:none;");
  const cls = (id) => (tab === id ? "centro-tab-btn active" : "centro-tab-btn");

  return `
    <div id="centro-tooltip" style="font-family: 'Segoe UI', Arial, sans-serif; width: 320px;">
        <div style="
            background: #2c3e50;
            color: white;
            padding: 10px 14px;
            font-weight: 600;
            font-size: 14px;
        ">
            ${p.denomCentro ?? ""}
        </div>

        <div class="centro-tabs">
            <button class="${cls("desc")}" data-tab="desc" onclick="selectCentroTab('desc')">DESCRIPCIÓN</button>
            <button class="${cls("unidades")}" data-tab="unidades" onclick="selectCentroTab('unidades')">UNIDADES</button>
            <button class="${cls("puestos")}" data-tab="puestos" onclick="selectCentroTab('puestos')">PUESTOS</button>
        </div>

        <div style="padding: 12px 14px; background: white;">
            <div class="centro-tab-panel" data-tab="desc" style="${vis("desc")}">${panelDescHtml(p)}</div>
            <div class="centro-tab-panel" data-tab="unidades" style="${vis("unidades")}">${panelUnidadesHtml(p)}</div>
            <div class="centro-tab-panel" data-tab="puestos" style="${vis("puestos")}">${panelPuestosHtml(p)}</div>
        </div>
        <div class="centro-pin-hint">📌 HAZ CLIC EN EL CENTRO PARA FIJAR ESTA FICHA</div>
    </div>
  `;
}

// --- Panel FIJADO por clic: igual contenido, pero permanece visible aunque
// el ratón se aleje del centro (hasta que se cierre con la X o se vuelva a
// hacer clic en el mismo centro). ---
function pinnedHtmlCentro(p) {
  const tab = pinTooltipTab;
  const vis = (id) => (tab === id ? "" : "display:none;");
  const cls = (id) => (tab === id ? "centro-tab-btn active" : "centro-tab-btn");

  return `
    <div id="centro-pin-content">
        <div class="pin-header">
            <span>${p.denomCentro ?? ""}</span>
            <button class="pin-close-btn" onclick="closePinnedCentro()" title="Cerrar">✕</button>
        </div>

        <div class="centro-tabs">
            <button class="${cls("desc")}" data-tab="desc" onclick="selectPinTab('desc')">DESCRIPCIÓN</button>
            <button class="${cls("unidades")}" data-tab="unidades" onclick="selectPinTab('unidades')">UNIDADES</button>
            <button class="${cls("puestos")}" data-tab="puestos" onclick="selectPinTab('puestos')">PUESTOS</button>
        </div>

        <div class="pin-body">
            <div class="centro-tab-panel" data-tab="desc" style="${vis("desc")}">${panelDescHtml(p)}</div>
            <div class="centro-tab-panel" data-tab="unidades" style="${vis("unidades")}">${panelUnidadesHtml(p)}</div>
            <div class="centro-tab-panel" data-tab="puestos" style="${vis("puestos")}">${panelPuestosHtml(p)}</div>
        </div>
    </div>
  `;
}

// --- Estado y control del panel fijado: al hacer clic en un centro, la
// ficha deja de "flotar" siguiendo al ratón y se queda estática, anclada en
// el punto exacto de pantalla (x, y) donde se hizo el clic. ---
let pinnedCentroProps = null;
let pinnedX = 0;
let pinnedY = 0;

function handleCentroClick(object, x, y) {
  if (!object) return;
  const p = object.properties;
  if (pinnedCentroProps && pinnedCentroProps.feature_id === p.feature_id) {
    closePinnedCentro();
    return;
  }
  pinnedCentroProps = p;
  pinnedX = x;
  pinnedY = y;
  pinTooltipTab = "desc";
  renderPinnedCentroPanel();
}

function closePinnedCentro() {
  pinnedCentroProps = null;
  document.getElementById("centro-pin-panel").style.display = "none";
}

function renderPinnedCentroPanel() {
  const panel = document.getElementById("centro-pin-panel");
  if (!pinnedCentroProps) {
    panel.style.display = "none";
    return;
  }
  // Se ancla en el punto de clic (con un pequeño desplazamiento para no
  // quedar justo debajo del cursor) y ya no se mueve de ahí, aunque se
  // haga zoom o se desplace el mapa: queda estática donde se hizo clic.
  panel.style.left = (pinnedX + 14) + "px";
  panel.style.top = (pinnedY + 14) + "px";
  panel.style.display = "";
  panel.innerHTML = pinnedHtmlCentro(pinnedCentroProps);
}

// --- Tooltip para las capas de reservas (solares / dotaciones con construcción) ---
function tooltipHtmlParcela(p) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; width: 280px;">
        <div style="
            background: #2c3e50;
            color: white;
            padding: 10px 14px;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            font-size: 14px;
        ">
            Parcela ${p.id_parcela ?? ""}
        </div>
        <div style="padding: 12px 14px; background: white; overflow: hidden;">
            <table style="width:100%; table-layout:fixed; border-collapse: collapse; font-size: 13px; color:#1e2b38;">
                <tr><td style="width:42%; padding:3px 4px 3px 0; color:#8695a7; vertical-align:top; overflow-wrap:break-word; word-break:break-word;">Clasificación</td><td style="width:58%; text-align:right; font-weight:600; vertical-align:top; overflow-wrap:break-word; word-break:break-word; white-space:normal;">${p.clasificacion_final_ajustada ?? p.clasificacion_final ?? ""}</td></tr>
                <tr><td style="width:42%; padding:3px 4px 3px 0; color:#8695a7; vertical-align:top; overflow-wrap:break-word; word-break:break-word;">Score solar</td><td style="width:58%; text-align:right; font-weight:600; vertical-align:top; overflow-wrap:break-word; word-break:break-word; white-space:normal;">${p.score_solar ?? ""}</td></tr>
                <tr><td style="width:42%; padding:3px 4px 3px 0; color:#8695a7; vertical-align:top; overflow-wrap:break-word; word-break:break-word;">Apto nueva construcción</td><td style="width:58%; text-align:right; font-weight:600; vertical-align:top; overflow-wrap:break-word; word-break:break-word; white-space:normal;">${p.apto_para_nueva_construccion ?? ""}</td></tr>
                <tr><td style="width:42%; padding:3px 4px 3px 0; color:#8695a7; vertical-align:top; overflow-wrap:break-word; word-break:break-word;">Motivo</td><td style="width:58%; text-align:right; font-weight:600; vertical-align:top; overflow-wrap:break-word; word-break:break-word; white-space:normal;">${p.motivo ?? ""}</td></tr>
            </table>
        </div>
    </div>
  `;
}

// --- Tooltip para la capa de secciones censales ---
function tooltipHtmlSeccion(p) {
  const filasEdad = TRAMOS_EDAD.map(([key, label]) =>
    `<tr><td style="padding:3px 0; color:#8695a7;">${label}</td><td style="text-align:right; font-weight:600;">${p[key] ?? ""}</td></tr>`
  ).join("");
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; width: 260px;">
        <div style="
            background: #2c3e50;
            color: white;
            padding: 10px 14px;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            font-size: 14px;
        ">
            ${p.NMUN ?? ""} — Sección ${p.CUSEC ?? ""}
        </div>
        <div style="padding: 12px 14px; background: white;">
            <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin-bottom:4px;">POBLACIÓN POR EDAD</div>
            <table style="width:100%; border-collapse: collapse; font-size: 13px; color:#1e2b38; margin-bottom:10px;">
                ${filasEdad}
            </table>
            <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin-bottom:4px;">PUESTOS ESCOLARES</div>
            <table style="width:100%; border-collapse: collapse; font-size: 13px; color:#1e2b38;">
                <tr><td style="padding:3px 0; color:#8695a7;">Autorizados</td><td style="text-align:right; font-weight:600;">${p.secPaTotal ?? ""}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Habilitados</td><td style="text-align:right; font-weight:600;">${p.secPhTotal ?? ""}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Sin funcionamiento</td><td style="text-align:right; font-weight:600;">${p.secPnfTotal ?? ""}</td></tr>
                <tr style="color:#1e8449;"><td style="padding:3px 0;">Activos</td><td style="text-align:right; font-weight:600;">${p.secPaAct ?? ""}</td></tr>
            </table>
        </div>
    </div>
  `;
}

const {DeckGL, GeoJsonLayer} = deck;

// --- El id del layer incluye régimen + categorías seleccionadas (ordenadas).
// Así, cualquier cambio destruye el layer anterior por completo y crea uno
// nuevo, evitando residuos visuales y geometría corrupta por reutilización de
// buffers entre datasets muy distintos. ---
function safeId(s) {
  return s.replace(/[^a-zA-Z0-9]+/g, "_");
}

function makeLayer(regimen, categorias, data) {
  const catKey = categorias.length ? [...categorias].sort().join("_") : "ALL";
  return new GeoJsonLayer({
    id: "parcelas-" + safeId(regimen) + "-" + safeId(catKey),
    data,
    opacity: 0.8,
    stroked: true,
    filled: true,
    extruded: true,
    wireframe: true,
    getElevation: f => f.properties.LIDAR_HMEAN_EDF ?? 0,
    elevationScale: 1,
    getFillColor: f => f.properties.fill_color ?? [155, 89, 182, 200],
    getLineColor: [255, 255, 255],
    pickable: true,
    onClick: ({object, x, y}) => handleCentroClick(object, x, y),
  });
}

// --- Capa adicional (combinable con los edificios 3D): agrupación de aulas
// prefabricadas, estilo nearcity.es/dashboard. Al alejar el zoom, los
// centros cercanos EN PANTALLA se funden en una sola burbuja que muestra la
// SUMA de aulas prefabricadas del grupo (tamaño Y color: azul = pocas,
// rojo = muchas); al acercar el zoom, los grupos se separan hasta mostrar
// cada centro por su cuenta. El agrupamiento se recalcula en cada cambio de
// vista (zoom/paneo), por eso usa la posición de cámara actual
// (lastViewState) en vez de un tamaño de celda fijo en grados. ---
let lastViewState = {
  longitude: -0.3763, latitude: 39.4699, zoom: 13, pitch: 45, bearing: 0,
};
let clusterRafScheduled = false;

function scheduleClusterRefresh() {
  // Solo merece la pena recalcular si la capa de agrupación está activa.
  if (!document.getElementById("chk-prefab-cluster").checked) return;
  if (clusterRafScheduled) return;
  clusterRafScheduled = true;
  requestAnimationFrame(() => {
    clusterRafScheduled = false;
    deckgl.setProps({layers: computeLayers()});
  });
}

function getCurrentViewport() {
  const mapDiv = document.getElementById("map");
  const width = mapDiv.clientWidth || window.innerWidth || 1;
  const height = mapDiv.clientHeight || window.innerHeight || 1;
  if (deck.WebMercatorViewport) {
    return new deck.WebMercatorViewport({...lastViewState, width, height});
  }
  // Fallback muy simple si el bundle de deck.gl no expusiera
  // WebMercatorViewport: proyección plana aproximada (suficiente para
  // agrupar centros cercanos, aunque no sea pixel-perfect).
  const scale = Math.pow(2, lastViewState.zoom) * 256 / 360;
  return {
    project([lon, lat]) {
      return [(lon - lastViewState.longitude) * scale + width / 2,
               (lastViewState.latitude - lat) * scale + height / 2];
    },
    unproject([x, y]) {
      return [lastViewState.longitude + (x - width / 2) / scale,
              lastViewState.latitude - (y - height / 2) / scale];
    },
  };
}

// Tamaño de celda en píxeles de pantalla: todos los centros cuyo centroide
// cae en la misma celda se funden en una única burbuja.
const CLUSTER_CELL_PX = 70;

// Escala de color de las burbujas (además del tamaño): azul = pocas aulas
// prefabricadas agrupadas, rojo = muchas.
const CLUSTER_COLOR_LOW = [41, 98, 255];
const CLUSTER_COLOR_HIGH = [214, 40, 40];

function interpolateClusterColor(t) {
  const c0 = CLUSTER_COLOR_LOW, c1 = CLUSTER_COLOR_HIGH;
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * t),
    Math.round(c0[1] + (c1[1] - c0[1]) * t),
    Math.round(c0[2] + (c1[2] - c0[2]) * t),
    220,
  ];
}

// Una misma referencia catastral (REFCAT) puede tener varias filas (una por
// uso de suelo SIOSE: EDF, PAV, DEP...), todas repitiendo el mismo valor de
// "aulasTotal" del centro. Para no inflar la suma, solo se cuenta UNA vez
// por REFCAT (la primera fila con la que aparece).
function dedupeByRefcat(features) {
  const seen = new Set();
  const out = [];
  for (const f of features) {
    const key = f.properties.refcat;
    if (key != null) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(f);
  }
  return out;
}

function clusterPrefabCentros(data) {
  const viewport = getCurrentViewport();
  const features = dedupeByRefcat(data.features);
  const cells = new Map();
  for (const f of features) {
    const lon = f.properties.lon, lat = f.properties.lat;
    if (lon == null || lat == null) continue;
    const [x, y] = viewport.project([lon, lat]);
    const key = Math.floor(x / CLUSTER_CELL_PX) + "_" + Math.floor(y / CLUSTER_CELL_PX);
    let c = cells.get(key);
    if (!c) {
      c = {sumLon: 0, sumLat: 0, count: 0, aulasSum: 0};
      cells.set(key, c);
    }
    c.sumLon += lon;
    c.sumLat += lat;
    c.count += 1;
    c.aulasSum += Number(f.properties.aulasTotal) || 0;
  }
  // Solo interesan los grupos que SÍ tienen aulas prefabricadas: es lo que
  // esta capa quiere resaltar (dónde se concentran).
  return Array.from(cells.values())
    .filter(c => c.aulasSum > 0)
    .map(c => ({
      position: [c.sumLon / c.count, c.sumLat / c.count],
      count: c.count,
      aulasSum: c.aulasSum,
    }));
}

function makePrefabClusterLayers(data) {
  const clusters = clusterPrefabCentros(data);
  const maxAulas = clusters.reduce((m, c) => Math.max(m, c.aulasSum), 1);

  const bubbles = new deck.ScatterplotLayer({
    id: "prefab-cluster-bubbles",
    data: clusters,
    getPosition: c => c.position,
    getRadius: c => 14 + 22 * Math.sqrt(c.aulasSum / maxAulas),
    radiusUnits: "pixels",
    getFillColor: c => interpolateClusterColor(c.aulasSum / maxAulas),
    getLineColor: [255, 255, 255, 230],
    lineWidthMinPixels: 1.5,
    stroked: true,
    pickable: false,
  });

  const labels = new deck.TextLayer({
    id: "prefab-cluster-labels",
    data: clusters,
    getPosition: c => c.position,
    getText: c => String(c.aulasSum),
    getSize: 13,
    getColor: [255, 255, 255, 255],
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontWeight: "bold",
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    pickable: false,
  });

  return [bubbles, labels];
}

// --- Capas fijas (no filtrables): reservas (solares sin construcción /
// dotaciones con construcción) ---
function makeExtraLayer(id, data, color) {
  return new GeoJsonLayer({
    id,
    data,
    opacity: 0.65,
    stroked: true,
    filled: true,
    extruded: false,
    getFillColor: color,
    getLineColor: [255, 255, 255],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

function buildReservasLayers() {
  const layers = [];
  if (document.getElementById("chk-reserva-sin-construccion").checked) {
    layers.push(makeExtraLayer("reserva-sin-construccion", reservasSinConstruccionData, COLOR_RESERVA_SIN_CONSTRUCCION));
  }
  if (document.getElementById("chk-reserva-con-construccion").checked) {
    layers.push(makeExtraLayer("reserva-con-construccion", reservasConConstruccionData, COLOR_RESERVA_CON_CONSTRUCCION));
  }
  return layers;
}

// --- Capa de secciones censales: coropleta plana con gradiente secuencial
// de un único matiz (claro = valor bajo, oscuro = valor alto) según el tramo
// de edad elegido en el desplegable. ---
function getTramoRange(tramoKey) {
  let min = Infinity, max = -Infinity;
  for (const f of seccionesData.features) {
    const v = f.properties[tramoKey] ?? 0;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!isFinite(min)) { min = 0; max = 0; }
  return {min, max};
}

function interpolateSeccionColor(t) {
  const c0 = SECCIONES_COLOR_LIGHT, c1 = SECCIONES_COLOR_DARK;
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * t),
    Math.round(c0[1] + (c1[1] - c0[1]) * t),
    Math.round(c0[2] + (c1[2] - c0[2]) * t),
    170,
  ];
}

function makeSeccionesLayer(tramoKey) {
  const {min, max} = getTramoRange(tramoKey);
  const span = (max - min) || 1;
  return new GeoJsonLayer({
    id: "secciones-" + tramoKey,
    data: seccionesData,
    opacity: 0.75,
    stroked: true,
    filled: true,
    extruded: false,
    getFillColor: f => interpolateSeccionColor(((f.properties[tramoKey] ?? 0) - min) / span),
    getLineColor: [255, 255, 255, 140],
    lineWidthMinPixels: 0.5,
    pickable: true,
  });
}

function tramoLabel(tramoKey) {
  const found = TRAMOS_EDAD.find(t => t[0] === tramoKey);
  return found ? found[1] : tramoKey;
}

function renderSeccionesLegend(tramoKey) {
  const {min, max} = getTramoRange(tramoKey);
  const c0 = `rgb(${SECCIONES_COLOR_LIGHT.join(",")})`;
  const c1 = `rgb(${SECCIONES_COLOR_DARK.join(",")})`;
  document.getElementById("legend-secciones-body").innerHTML = `
    <div style="font-size:12.5px; color:#2c3e50; font-weight:500; margin-bottom:8px;">${tramoLabel(tramoKey)}</div>
    <div style="height:12px; border-radius:6px; background: linear-gradient(to right, ${c0}, ${c1}); margin-bottom:4px; border:1px solid rgba(0,0,0,0.08);"></div>
    <div style="display:flex; justify-content:space-between; font-size:11px; color:#8695a7;">
      <span>${min}</span><span>${max}</span>
    </div>
  `;
}

function renderPrefabLegend(filtered) {
  const clusters = clusterPrefabCentros(filtered);
  const maxAulas = clusters.reduce((m, c) => Math.max(m, c.aulasSum), 0);
  const c0 = `rgb(${CLUSTER_COLOR_LOW.join(",")})`;
  const c1 = `rgb(${CLUSTER_COLOR_HIGH.join(",")})`;
  document.getElementById("legend-prefab-body").innerHTML = `
    <div style="font-size:12.5px; color:#2c3e50; font-weight:500; margin-bottom:8px;">Aulas prefabricadas agrupadas (por REFCAT)</div>
    <div style="height:12px; border-radius:6px; background: linear-gradient(to right, ${c0}, ${c1}); margin-bottom:4px; border:1px solid rgba(0,0,0,0.08);"></div>
    <div style="display:flex; justify-content:space-between; font-size:11px; color:#8695a7;">
      <span>Pocas</span><span>Muchas (máx. ${maxAulas})</span>
    </div>
  `;
}

// --- Capas (orden = orden visual: fondo -> frente). Los edificios 3D de
// centros y la agrupación de aulas prefabricadas son combinables: la
// agrupación se añade ENCIMA de los edificios cuando su casilla está
// marcada, no los sustituye. ---
function computeLayers() {
  const layers = [];

  if (document.getElementById("chk-layer-secciones").checked) {
    layers.push(makeSeccionesLayer(document.getElementById("tramo-select").value));
  }

  if (document.getElementById("chk-layer-reservas").checked) {
    layers.push(...buildReservasLayers());
  }

  if (document.getElementById("chk-layer-centros").checked) {
    const regimen = document.getElementById("regimen-filter").value;
    const categorias = Array.from(document.querySelectorAll(".tipo-checkbox:checked")).map(el => el.value);
    const filtered = buildData(regimen, categorias);
    layers.push(makeLayer(regimen, categorias, filtered));
    if (document.getElementById("chk-prefab-cluster").checked) {
      layers.push(...makePrefabClusterLayers(filtered));
    }
  }

  return layers;
}

const deckgl = new DeckGL({
  container: "map",
  mapStyle: mapStyles.mapa,
  initialViewState: {
    longitude: -0.3763,
    latitude: 39.4699,
    zoom: 13,
    pitch: 45,
    bearing: 0
  },
  controller: true,
  layers: computeLayers(),
  // No se usa para controlar la cámara (eso lo gestiona deck.gl solo, ya
  // que solo pasamos initialViewState): es únicamente para que la vista de
  // agrupación de aulas prefabricadas sepa el zoom/posición actuales y
  // pueda recalcular los grupos al acercar/alejar o desplazar el mapa.
  onViewStateChange: ({viewState}) => {
    lastViewState = viewState;
    scheduleClusterRefresh();
  },
  getTooltip: ({object}) => {
    if (!object) return null;
    const p = object.properties;
    let html;
    if (p && p.CUSEC !== undefined) html = tooltipHtmlSeccion(p);
    else if (p && p.id_parcela !== undefined) html = tooltipHtmlParcela(p);
    else html = tooltipHtmlCentro(p);
    return {
      html,
      style: {
        backgroundColor: "white",
        padding: "0px",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        // "none": el ratón atraviesa la ficha y deck.gl sigue viendo el
        // objeto bajo el cursor sin interrupción (evita el parpadeo). Los
        // botones de pestaña reactivan pointer-events en su propia regla CSS.
        pointerEvents: "none"
      }
    };
  }
});

// --- Sincroniza la UI (paneles de filtro visibles, leyendas, contador) con
// el estado actual de las 3 capas maestras, SIN tocar deck.gl. ---
function syncUI() {
  const onCentros = document.getElementById("chk-layer-centros").checked;
  const onReservas = document.getElementById("chk-layer-reservas").checked;
  const onSecciones = document.getElementById("chk-layer-secciones").checked;
  const prefabOn = document.getElementById("chk-prefab-cluster").checked;

  document.getElementById("panel-centros").style.display = onCentros ? "" : "none";
  document.getElementById("panel-secciones").style.display = onSecciones ? "" : "none";
  document.getElementById("legend-uso").style.display = onCentros ? "" : "none";
  document.getElementById("legend-reservas").style.display = onReservas ? "" : "none";
  document.getElementById("legend-secciones").style.display = onSecciones ? "" : "none";
  document.getElementById("legend-prefab").style.display = (onCentros && prefabOn) ? "" : "none";

  const counter = document.getElementById("parcel-count");
  if (onCentros) {
    counter.style.display = "";
    const regimen = document.getElementById("regimen-filter").value;
    const categorias = Array.from(document.querySelectorAll(".tipo-checkbox:checked")).map(el => el.value);
    const filtered = buildData(regimen, categorias);
    updateControlsUI(regimen, categorias, filtered.features.length);
    if (prefabOn) {
      renderPrefabLegend(filtered);
    }
  } else {
    counter.style.display = "none";
  }

  if (onSecciones) {
    renderSeccionesLegend(document.getElementById("tramo-select").value);
  }

  // Si se desmarca la capa de centros mientras había un centro fijado, no
  // tiene sentido dejar el panel abierto.
  if (!onCentros && pinnedCentroProps) {
    closePinnedCentro();
  }
}

// --- Punto de entrada único para cualquier cambio de filtro o de capa ---
function rebuildAll() {
  syncUI();
  deckgl.setProps({layers: computeLayers()});
}

syncUI();

document.getElementById("chk-layer-centros").addEventListener("change", rebuildAll);
document.getElementById("chk-layer-reservas").addEventListener("change", rebuildAll);
document.getElementById("chk-layer-secciones").addEventListener("change", rebuildAll);

document.getElementById("regimen-filter").addEventListener("change", rebuildAll);
document.querySelectorAll(".tipo-checkbox").forEach(el => el.addEventListener("change", rebuildAll));
document.getElementById("chk-prefab-cluster").addEventListener("change", rebuildAll);
document.getElementById("chk-reserva-sin-construccion").addEventListener("change", rebuildAll);
document.getElementById("chk-reserva-con-construccion").addEventListener("change", rebuildAll);
document.getElementById("tramo-select").addEventListener("change", rebuildAll);

// --- Selector de capa base: cambia el mapStyle de deck.gl/MapLibre en caliente ---
const btnMapa = document.getElementById("btn-mapa");
const btnSatelite = document.getElementById("btn-satelite");

function setBasemap(nombre) {
  deckgl.setProps({mapStyle: mapStyles[nombre]});
  btnMapa.classList.toggle("active", nombre === "mapa");
  btnSatelite.classList.toggle("active", nombre === "satelite");
}

btnMapa.addEventListener("click", () => setBasemap("mapa"));
btnSatelite.addEventListener("click", () => setBasemap("satelite"));
