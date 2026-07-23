import geopandas as gpd
import json

# --- 1. Build GeoDataFrame ---
gdf = gpd.GeoDataFrame(df_siose_mapa, crs="EPSG:25830", geometry="geometry_x")
gdf["area"] = round(gdf.area, 3)

# --- 2. Color and label maps (kept here only to compute fill_color / uso_label; ---
# ---    the same maps also live in script.js for the legend and filter UI)     ---
color_map = {
    "EDF": [64, 64, 64, 200],
    "PAV": [200, 200, 200, 200],
    "DEP": [231, 76, 60, 200],
    "OCT": [121, 85, 61, 200],
    "ZAU": [39, 174, 96, 200],
    "PSC": [52, 152, 219, 200],
}

label_map = {
    "EDF": "Edificación",
    "PAV": "Pavimento",
    "DEP": "Zona deportiva",
    "PSC": "Piscina",
    "ZAU": "Zona verde urbana",
    "OCT": "Otros usos",
}

# --- 3. Apply color and label columns ---
gdf["fill_color"] = gdf["ROTULO_x"].map(color_map)
gdf["uso_label"] = gdf["ROTULO_x"].map(label_map)

# --- 4. Reproject to WGS84 (deck.gl / web maps expect lon/lat) ---
gdf_wgs84 = gdf.to_crs(epsg=4326)
geojson_data = json.loads(gdf_wgs84.to_json())

# --- 5. Write out data.geojson next to index.html / script.js / style.css ---
with open("data.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson_data, f, ensure_ascii=False)

print("data.geojson written — copy it into the same folder as index.html, style.css and script.js")
