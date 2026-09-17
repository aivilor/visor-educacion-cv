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

// --- Tooltip (mismo contenido que la versión pydeck) ---
function tooltipHtml(p) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; width: 320px;">
        <div style="
            background: #2c3e50;
            color: white;
            padding: 10px 14px;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            font-size: 14px;
        ">
            ${p.denomCentro ?? ""}
        </div>

        <div style="padding: 12px 14px; background: white;">

            <table style="width:100%; border-collapse: collapse; font-size: 13px; color:#1e2b38; margin-bottom:8px;">
                <tr><td style="padding:3px 0; color:#8695a7;">ID centro</td><td style="text-align:right; font-weight:600;">${p.codCentro ?? ""}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">REFCAT</td><td style="text-align:right; font-weight:600;">${p.refcat ?? ""}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Régimen</td><td style="text-align:right; font-weight:600;">${p.regimen ?? ""}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Tipo educativo</td><td style="text-align:right; font-weight:600;">${p.tipoEducacion ?? ""}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Categorías</td><td style="text-align:right; font-weight:600;">${(p.categoriasEducativas || []).join(", ")}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Uso</td><td style="text-align:right; font-weight:600;">${p.uso_label ?? ""}</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Área / Altura</td><td style="text-align:right; font-weight:600;">${p.area ?? ""} m² · ${p.LIDAR_HMEAN_EDF ?? ""} m</td></tr>
                <tr><td style="padding:3px 0; color:#8695a7;">Fecha construcción</td><td style="text-align:right; font-weight:600;">${p.FECHA ?? ""}</td></tr>
            </table>

            <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin:8px 0 4px;">UNIDADES / PUESTOS TOTALES</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; font-size:12.5px; color:#1e2b38; background:#f7f9fa; border-radius:6px; padding:8px;">
                <div>Unid. autorizadas <b style="float:right;">${p.uaTotal ?? ""}</b></div>
                <div>Pue. autorizados <b style="float:right;">${p.paTotal ?? ""}</b></div>
                <div>Unid. habilitadas <b style="float:right;">${p.uhTotal ?? ""}</b></div>
                <div>Pue. habilitados <b style="float:right;">${p.phTotal ?? ""}</b></div>
                <div>Unid. sin func. <b style="float:right;">${p.unfTotal ?? ""}</b></div>
                <div>Pue. sin func. <b style="float:right;">${p.pnfTotal ?? ""}</b></div>
                <div style="color:#1e8449;">Unid. activas <b style="float:right;">${p.uaAct ?? ""}</b></div>
                <div style="color:#1e8449;">Pue. activos <b style="float:right;">${p.paAct ?? ""}</b></div>
            </div>

            <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin:10px 0 4px;">UNIDADES AUTORIZADAS POR ETAPA</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; font-size:12px; color:#1e2b38;">
                <div>Ed. Infantil  <b style="float:right;">${p.uaInfantil ?? ""}</b></div>
                <div>Ed. Primaria <b style="float:right;">${p.uaPrimaria ?? ""}</b></div>
                <div>ESO <b style="float:right;">${p.uaEso ?? ""}</b></div>
                <div>Bachiller <b style="float:right;">${p.uaBach ?? ""}</b></div>
            </div>

            <div style="font-size:11px; font-weight:700; color:#8695a7; letter-spacing:0.5px; margin:10px 0 4px;">MATRICULACIONES POR ETAPA (2025)</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; font-size:12px; color:#1e2b38;">
                <div>Ed. Infantil <b style="float:right;">${p.matEi ?? ""}</b></div>
                <div>Ed. Primaria <b style="float:right;">${p.matEp ?? ""}</b></div>
                <div>ESO <b style="float:right;">${p.matEso ?? ""}</b></div>
                <div>Bachiller <b style="float:right;">${p.matBach ?? ""}</b></div>
            </div>

        </div>
    </div>
  `;
}

// --- Tooltip para las capas de solares / construcción ---
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
  });
}

// --- Capas fijas (no filtrables): posibles solares y dotaciones con construcción ---
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

function buildExtraLayers() {
  const layers = [];
  if (document.getElementById("chk-solares").checked) {
    layers.push(makeExtraLayer("solares", solaresData, COLOR_SOLARES));
  }
  if (document.getElementById("chk-construccion").checked) {
    layers.push(makeExtraLayer("construccion", construccionData, COLOR_CONSTRUCCION));
  }
  return layers;
}

const initialData = buildData("TODOS", []);

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
  layers: [makeLayer("TODOS", [], initialData), ...buildExtraLayers()],
  getTooltip: ({object}) => {
    if (!object) return null;
    const esParcela = object.properties && object.properties.id_parcela !== undefined;
    return {
      html: esParcela ? tooltipHtmlParcela(object.properties) : tooltipHtml(object.properties),
      style: {
        backgroundColor: "white",
        padding: "0px",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }
    };
  }
});

// Estado inicial del panel de control (sin filtros)
updateControlsUI("TODOS", [], initialData.features.length);

// --- Filtros combinables: cualquier cambio reconstruye la capa entera con el
// régimen actual y TODAS las categorías marcadas en ese momento ---
function applyFilters() {
  const regimen = document.getElementById("regimen-filter").value;
  const categorias = Array.from(document.querySelectorAll(".tipo-checkbox:checked")).map(el => el.value);
  const filtered = buildData(regimen, categorias);
  deckgl.setProps({layers: [makeLayer(regimen, categorias, filtered), ...buildExtraLayers()]});
  updateControlsUI(regimen, categorias, filtered.features.length);
}

document.getElementById("regimen-filter").addEventListener("change", applyFilters);
document.querySelectorAll(".tipo-checkbox").forEach(el => el.addEventListener("change", applyFilters));
document.getElementById("chk-solares").addEventListener("change", applyFilters);
document.getElementById("chk-construccion").addEventListener("change", applyFilters);

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
