import React from 'react';
import './ResultsPanel.css';

function ResultsPanel({ results }) {
  const { water_polygons, metadata } = results;

  const handleDownload = () => {
    const dataStr = JSON.stringify(water_polygons, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water_detection_${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const featureCount = water_polygons?.features?.length || 0;

  return (
    <div className="results-panel">
      <div className="results-header">
        <h3>Detection Results</h3>
        <button className="close-btn" onClick={() => {}}>×</button>
      </div>

      <div className="results-content">
        {metadata.warning && (
          <div className="warning-box">
            <strong>Warning:</strong> {metadata.warning}
          </div>
        )}

        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="metadata-label">Acquisition Date</span>
            <span className="metadata-value">
              {metadata.acquisition_date || 'N/A'}
            </span>
          </div>

          <div className="metadata-item">
            <span className="metadata-label">Water Area</span>
            <span className="metadata-value">
              {metadata.water_area_km2?.toFixed(3) || 0} km²
            </span>
          </div>

          <div className="metadata-item">
            <span className="metadata-label">Water Coverage</span>
            <span className="metadata-value">
              {metadata.water_percentage?.toFixed(2) || 0}%
            </span>
          </div>

          <div className="metadata-item">
            <span className="metadata-label">Processing Time</span>
            <span className="metadata-value">
              {metadata.processing_time_seconds}s
            </span>
          </div>

          <div className="metadata-item">
            <span className="metadata-label">Polygons Detected</span>
            <span className="metadata-value">
              {featureCount}
            </span>
          </div>

          {metadata.aoi_area_km2 && (
            <div className="metadata-item">
              <span className="metadata-label">AOI Area</span>
              <span className="metadata-value">
                {metadata.aoi_area_km2?.toFixed(2)} km²
              </span>
            </div>
          )}
        </div>

        {metadata.parameters_used && (
          <div className="parameters-used">
            <strong>Parameters Used:</strong>
            <ul>
              {Object.entries(metadata.parameters_used).map(([key, value]) => (
                <li key={key}>
                  <span>{key.replace(/_/g, ' ')}:</span> {value}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          className="download-btn"
          onClick={handleDownload}
          disabled={featureCount === 0}
        >
          📥 Download GeoJSON
        </button>
      </div>
    </div>
  );
}

export default ResultsPanel;
