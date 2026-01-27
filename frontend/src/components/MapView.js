import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap, ScaleControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './MapView.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to fly to selected AOI
function FlyToAOI({ selectedAoi }) {
  const map = useMap();

  useEffect(() => {
    if (selectedAoi) {
      map.flyTo(selectedAoi.center, selectedAoi.zoom, {
        duration: 1.5
      });
    }
  }, [selectedAoi, map]);

  return null;
}

// Component for basemap control
function BasemapControl({ basemap, setBasemap }) {
  return (
    <div className="basemap-control">
      <button
        className={basemap === 'osm' ? 'active' : ''}
        onClick={() => setBasemap('osm')}
        title="OpenStreetMap"
      >
        Map
      </button>
      <button
        className={basemap === 'satellite' ? 'active' : ''}
        onClick={() => setBasemap('satellite')}
        title="Satellite Imagery"
      >
        Satellite
      </button>
    </div>
  );
}

// Component for location search
function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    map.flyTo([lat, lon], 13, { duration: 1.5 });
    setShowResults(false);
    setQuery('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-bar">
      <div className="search-input-group">
        <input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="search-input"
        />
        <button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="search-button"
        >
          {isSearching ? '...' : '🔍'}
        </button>
      </div>
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              {result.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapView({ selectedAoi, drawnAoi, onAoiDrawStart, onAoiDraw, results, basemap, setBasemap, sentinelOverlay, overlayOpacity, showSentinel, showResults }) {
  const featureGroupRef = useRef();

  const handleDrawStart = (e) => {
    // Clear previous state when starting a new draw
    onAoiDrawStart();
  };

  const handleCreated = (e) => {
    const { layer } = e;
    
    // Clear previous drawings
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }

    // Add new layer
    const geoJSON = layer.toGeoJSON();
    onAoiDraw(geoJSON.geometry);
  };

  const handleDeleted = (e) => {
    onAoiDraw(null);
  };

  // Render drawn AOI polygon
  const drawnAoiPolygon = drawnAoi ? {
    type: 'Feature',
    geometry: drawnAoi
  } : null;

  // Render selected AOI polygon
  const selectedAoiPolygon = selectedAoi ? {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [selectedAoi.coordinates]
    }
  } : null;

  return (
    <div className="map-view">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Scale control */}
        <ScaleControl position="bottomleft" imperial={false} />
        
        {/* Search bar */}
        <SearchBar />
        
        {/* Basemap layers */}
        {basemap === 'osm' ? (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        ) : (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            maxZoom={19}
          />
        )}

        {/* Drawing tools */}
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onDrawStart={handleDrawStart}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
            draw={{
              rectangle: true,
              polygon: true,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
            }}
            edit={{
              edit: false,
              remove: true,
            }}
          />
        </FeatureGroup>

        {/* Drawn AOI */}
        {drawnAoiPolygon && (
          <GeoJSON
            data={drawnAoiPolygon}
            style={{
              color: '#8b5cf6',
              weight: 3,
              fillOpacity: 0.1,
            }}
          />
        )}

        {/* Selected test AOI */}
        {selectedAoiPolygon && (
          <GeoJSON
            data={selectedAoiPolygon}
            style={{
              color: '#ff7800',
              weight: 3,
              fillOpacity: 0.1,
            }}
          />
        )}

        {/* Sentinel-1 overlay */}
        {sentinelOverlay && showSentinel && (
          <TileLayer
            url={sentinelOverlay.url}
            opacity={overlayOpacity}
            zIndex={500}
          />
        )}

        {/* Water detection results */}
        {showResults && results && results.water_polygons && results.water_polygons.features.length > 0 && (
          <GeoJSON
            data={results.water_polygons}
            style={{
              color: '#0080ff',
              weight: 2,
              fillColor: '#0080ff',
              fillOpacity: 0.4,
            }}
          />
        )}

        {/* Fly to selected AOI */}
        <FlyToAOI selectedAoi={selectedAoi} />
      </MapContainer>

      {/* Basemap control */}
      <BasemapControl basemap={basemap} setBasemap={setBasemap} />
    </div>
  );
}

export default MapView;
