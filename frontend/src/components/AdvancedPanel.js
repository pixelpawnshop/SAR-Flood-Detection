import React from 'react';
import './AdvancedPanel.css';

function AdvancedPanel({ showAdvanced, setShowAdvanced, params, setParams }) {
  const handleParamChange = (key, value) => {
    setParams({
      ...params,
      [key]: value === '' ? null : value,
    });
  };

  const handleNumericChange = (key, value) => {
    setParams({
      ...params,
      [key]: value === '' ? null : parseFloat(value),
    });
  };

  return (
    <div className="advanced-panel">
      <button
        className="toggle-button"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▼' : '▶'} Advanced Parameters
      </button>

      {showAdvanced && (
        <div className="advanced-content">
          <p className="advanced-help">
            Fine-tune detection settings for specific scenarios.
          </p>

          <div className="param-group">
            <label>
              <span className="param-label">End Date (optional)</span>
              <span className="param-value">
                {params.start_date || 'Latest available'}
              </span>
            </label>
            <input
              type="date"
              value={params.start_date || ''}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleParamChange('start_date', e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
            <button
              className="reset-btn"
              onClick={() => handleParamChange('start_date', '')}
            >
              Reset
            </button>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
              Searches for latest image on or before this date
            </p>
          </div>

          <div className="param-group">
            <label>
              <span className="param-label">Max Slope (degrees)</span>
              <span className="param-value">
                {params.slope_max ?? 5}°
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={params.slope_max ?? 5}
              onChange={(e) => handleNumericChange('slope_max', e.target.value)}
            />
            <button
              className="reset-btn"
              onClick={() => handleParamChange('slope_max', '')}
            >
              Reset
            </button>
          </div>

          <div className="param-group">
            <label>
              <span className="param-label">Min Area (pixels)</span>
              <span className="param-value">
                {params.min_area_pixels ?? 100}
              </span>
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={params.min_area_pixels ?? 100}
              onChange={(e) => handleNumericChange('min_area_pixels', e.target.value)}
            />
            <button
              className="reset-btn"
              onClick={() => handleParamChange('min_area_pixels', '')}
            >
              Reset
            </button>
          </div>

          <button
            className="reset-all-btn"
            onClick={() => setParams({
              start_date: null,
              slope_max: null,
              min_area_pixels: null,
            })}
          >
            Reset All to Defaults
          </button>
        </div>
      )}
    </div>
  );
}

export default AdvancedPanel;
