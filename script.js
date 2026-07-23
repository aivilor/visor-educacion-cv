// ---------------------------------------------------------------------------
// CONFIG: colors and labels per category (ROTULO_x)
// ---------------------------------------------------------------------------
const colorMap = {
    "EDF": [64, 64, 64, 200],     // dark gray
    "PAV": [200, 200, 200, 200],  // light gray
    "DEP": [231, 76, 60, 200],    // red
    "OCT": [121, 85, 61, 200],    // brown
    "ZAU": [39, 174, 96, 200],    // green
    "PSC": [52, 152, 219, 200],   // blue
};

const labelMap = {
    "EDF": "Edificación",
    "PAV": "Pavimento",
    "DEP": "Zona deportiva",
    "PSC": "Piscina",
    "ZAU": "Zona verde urbana",
    "OCT": "Otros usos",
};

const VIEW_CENTER = { latitude: 39.4699, longitude: -0.3763 };

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
let fullGeoJsonData = null;
let deckInstance = null;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function fmt(v) {
    return (v === undefined || v === null || v === "") ? "—" : v;
}

function buildLayer(geojson) {
    return new deck.GeoJsonLayer({
        id: "geojson-layer",
        data: geojson,
        opacity: 0.8,
        stroked: true,
        filled: true,
        extruded: true,
        wireframe: true,
        getElevation: f => f.properties.LIDAR_HMEAN_EDF,
        elevationScale: 1,
        getFillColor: f => f.properties.fill_color,
        getLineColor: [255, 255, 255],
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 0, 120],
        onHover: updateInfoPanel,
    });
}

// ---------------------------------------------------------------------------
// INFO PANEL (hover)
// ---------------------------------------------------------------------------
function updateInfoPanel(info) {
    const panel = document.getElementById("info-panel");
    const header = document.getElementById("info-panel-header");
    const body = document.getElementById("info-panel-body");

    if (!info || !info.object) {
        panel.style.display = "none";
        return;
    }

    const p = info.object.properties;
    panel.style.display = "block";
    header.innerHTML = fmt(p.denomCentro);

    body.innerHTML = `
        <table class="info-table">
            <tr><td>ID centro</td><td>${fmt(p.codCentro)}</td></tr>
            <tr><td>REFCAT</td><td>${fmt(p.REFCAT_x)}</td></tr>
            <tr><td>Uso</td><td>${fmt(p.uso_label)}</td></tr>
            <tr><td>Área / Altura</td><td>${fmt(p.area)} m² · ${fmt(p.LIDAR_HMEAN_EDF)} m</td></tr>
            <tr><td>Fecha construcción</td><td>${fmt(p.FECHA)}</td></tr>
        </table>

        <div class="info-section-label">UNIDADES / PUESTOS TOTALES</div>
        <div class="info-grid highlight">
            <div>Unid. autorizadas <b>${fmt(p.unidadesAutorizadas_Total)}</b></div>
            <div>Pue. autorizados <b>${fmt(p.puestosAutorizados_Total)}</b></div>
            <div>Unid. habilitadas <b>${fmt(p.unidadesHabilitadas_Total)}</b></div>
            <div>Pue. habilitados <b>${fmt(p.puestosHabilitados_Total)}</b></div>
            <div>Unid. sin func. <b>${fmt(p.unidadesNoFuncionamiento_Total)}</b></div>
            <div>Pue. sin func. <b>${fmt(p.puestosNoFuncionamiento_Total)}</b></div>
            <div class="active-value">Unid. activas <b>${fmt(p.unidadesActivas_Total)}</b></div>
            <div class="active-value">Pue. activos <b>${fmt(p.puestosActivos_Total)}</b></div>
        </div>

        <div class="info-section-label">UNIDADES AUTORIZADAS POR ETAPA</div>
        <div class="info-grid">
            <div>Ed. Infantil <b>${fmt(p["unidadesAutorizadas_EDUCACIÓ INFANTIL SEGON CICLE"])}</b></div>
            <div>Ed. Primaria <b>${fmt(p["unidadesAutorizadas_EDUCACIÓ PRIMÀRIA"])}</b></div>
            <div>ESO <b>${fmt(p.unidadesAutorizadas_ESO)}</b></div>
            <div>Bachiller <b>${fmt(p.unidadesAutorizadas_BATXILLERAT)}</b></div>
        </div>

        <div class="info-section-label">MATRICULACIONES POR ETAPA (2025)</div>
        <div class="info-grid">
            <div>Ed. Infantil <b>${fmt(p.TOTAL_MATRICULACIONES_EI)}</b></div>
            <div>Ed. Primaria <b>${fmt(p.TOTAL_MATRICULACIONES_EP)}</b></div>
            <div>ESO <b>${fmt(p.TOTAL_MATRICULACIONES_ESO)}</b></div>
            <div>Bachiller <b>${fmt(p.TOTAL_MATRICULACIONES_BACH)}</b></div>
        </div>
    `;
}

// ---------------------------------------------------------------------------
// LEGEND
// ---------------------------------------------------------------------------
function buildLegend() {
    const container = document.getElementById("legend-items");
    container.innerHTML = "";

    Object.entries(colorMap).forEach(([code, rgb]) => {
        const label = labelMap[code] || code;
        const row = document.createElement("div");
        row.className = "legend-row";
        row.innerHTML = `
            <div class="legend-swatch" style="background: rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]});"></div>
            <span class="legend-label">${label}</span>
        `;
        container.appendChild(row);
    });
}

// ---------------------------------------------------------------------------
// FILTER
// ---------------------------------------------------------------------------
function buildFilter() {
    const container = document.getElementById("filter-items");
    container.innerHTML = "";

    Object.entries(labelMap).forEach(([code, label]) => {
        const row = document.createElement("label");
        row.className = "filter-row";
        row.innerHTML = `
            <input type="checkbox" checked value="${code}">
            ${label}
        `;
        row.querySelector("input").addEventListener("change", onFilterChange);
        container.appendChild(row);
    });
}

function getCheckedCategories() {
    const checkboxes = document.querySelectorAll('#filter-items input[type="checkbox"]');
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
}

function onFilterChange() {
    const checked = getCheckedCategories();

    const filteredFeatures = fullGeoJsonData.features.filter(
        f => checked.includes(f.properties.ROTULO_x)
    );

    const filteredGeoJson = {
        type: "FeatureCollection",
        features: filteredFeatures,
    };

    deckInstance.setProps({ layers: [buildLayer(filteredGeoJson)] });
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
async function init() {
    const response = await fetch("data.geojson");
    fullGeoJsonData = await response.json();

    deckInstance = new deck.DeckGL({
        container: "map",
        mapStyle: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        initialViewState: {
            latitude: VIEW_CENTER.latitude,
            longitude: VIEW_CENTER.longitude,
            zoom: 13,
            pitch: 45,
            bearing: 0,
        },
        controller: true,
        layers: [buildLayer(fullGeoJsonData)],
    });

    buildLegend();
    buildFilter();
}

init();
