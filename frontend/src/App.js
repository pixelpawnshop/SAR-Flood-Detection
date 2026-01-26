import React, { useState } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ProgressIndicator from './components/ProgressIndicator';
import ResultsPanel from './components/ResultsPanel';
import { detectWater } from './services/api';
import { validateAOI } from './utils/validator';
import './App.css';

function App() {
  const [selectedAoi, setSelectedAoi] = useState(null);
  const [drawnAoi, setDrawnAoi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [basemap, setBasemap] = useState('osm');
  const [sentinelOverlay, setSentinelOverlay] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [showResults, setShowResults] = useState(true);
  const [advancedParams, setAdvancedParams] = useState({
    vv_threshold: null,
    vh_threshold: null,
    vv_vh_diff: null,
    slope_max: null,
    min_area_pixels: null,
    texture_window: null,
  });

  const handleAoiSelect = (aoi) => {
    setSelectedAoi(aoi);
    setDrawnAoi(null);
    setResults(null);
    setError(null);
  };

  const handleAoiDraw = (geometry) => {
    setDrawnAoi(geometry);
    setSelectedAoi(null);
    setResults(null);
    setError(null);
  };

  const handleDetectWater = async () => {
    // Get current AOI (drawn or selected)
    const currentAoi = drawnAoi || (selectedAoi ? {
      type: 'Polygon',
      coordinates: [selectedAoi.coordinates]
    } : null);

    if (!currentAoi) {
      setError('Please draw an AOI or select a test location');
      return;
    }

    // Validate AOI
    const validation = validateAOI(currentAoi);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // Start detection
    setLoading(true);
    setError(null);
    setResults(null);
    setProcessingStage('imagery');

    try {
      // Prepare parameters (only send non-null values)
      const params = {};
      Object.keys(advancedParams).forEach(key => {
        if (advancedParams[key] !== null) {
          params[key] = advancedParams[key];
        }
      });

      // Call API
      const data = await detectWater(
        currentAoi,
        params,
        (stage) => setProcessingStage(stage)
      );

      setResults(data);
      
      // Set Sentinel overlay if tile URL is provided
      if (data.tile_url) {
        setSentinelOverlay({
          url: data.tile_url,
          bounds: data.image_bounds
        });
      }
      
      setProcessingStage(null);
      
    } catch (err) {
      setError(err.message || 'An error occurred during detection');
      setProcessingStage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🛰️ SAR Flood Detection</h1>
        <p>Detect surface water using Sentinel-1 SAR imagery</p>
      </header>

      <div className="App-content">
        <Sidebar
          onAoiSelect={handleAoiSelect}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          advancedParams={advancedParams}
          setAdvancedParams={setAdvancedParams}
          onDetectWater={handleDetectWater}
          loading={loading}
        />

        <div className="map-container">
          <MapView
            selectedAoi={selectedAoi}
            drawnAoi={drawnAoi}
            onAoiDraw={handleAoiDraw}
            results={results}
            basemap={basemap}
            setBasemap={setBasemap}
            sentinelOverlay={sentinelOverlay}
            overlayOpacity={overlayOpacity}
            showResults={showResults}
          />

          <div className="map-controls">
            {sentinelOverlay && (
              <div className="overlay-control">
                <label>Sentinel-1:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                />
                <span>{Math.round(overlayOpacity * 100)}%</span>
                <button onClick={() => setSentinelOverlay(null)}>Hide</button>
              </div>
            )}

            {results && (
              <div className="results-toggle-control">
                <label>Water Polygons:</label>
                <button 
                  className={showResults ? 'active' : ''}
                  onClick={() => setShowResults(!showResults)}
                >
                  {showResults ? 'Visible' : 'Hidden'}
                </button>
              </div>
            )}
          </div>

          {loading && (
            <ProgressIndicator stage={processingStage} />
          )}

          {error && (
            <div className="error-banner">
              <strong>Error:</strong> {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {results && (
            <ResultsPanel results={results} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
