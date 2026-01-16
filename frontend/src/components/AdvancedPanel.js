import React from 'react';
import './AdvancedPanel.css';

function AdvancedPanel({ showAdvanced, setShowAdvanced, params, setParams }) {
  const handleParamChange = (key, value) => {
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
            Leave blank to use automatic (Otsu) thresholding. 
            Adjust these values to fine-tune water detection.
          </p>

          <div className="param-group">
            <label>
              <span className="param-label">VV Threshold (dB)</span>
              <span className="param-value">
                {params.vv_threshold ?? 'Auto'}
              </span>
            </label>
            <input
              type="range"
              min="-25"
              max="-5"
              step="0.5"
              value={params.vv_threshold ?? -15}
              onChange={(e) => handleParamChange('vv_threshold', e.target.value)}
            />
            <button
              className="reset-btn"
              onClick={() => handleParamChange('vv_threshold', '')}
            >
              Reset
            </button>
          </div>

          <div className="param-group">
            <label>
              <span className="param-label">VH Threshold (dB)</span>
              <span className="param-value">
                {params.vh_threshold ?? -20}
              </span>
            </label>
            <input
              type="range"
              min="-30"
              max="-10"
              step="0.5"
              value={params.vh_threshold ?? -20}
              onChange={(e) => handleParamChange('vh_threshold', e.target.value)}
            />
            <button
              className="reset-btn"
              onClick={() => handleParamChange('vh_threshold', '')}
            >
              Reset
            </button>
          </div>

          <div className="param-group">
            <label>
              <span className="param-label">VV-VH Difference</span>
              <span className="param-value">
                {params.vv_vh_diff ?? 2}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={params.vv_vh_diff ?? 2}
              onChange={(e) => handleParamChange('vv_vh_diff', e.target.value)}
            />
            <button
              className="reset-btn"
              onClick={() => handleParamChange('vv_vh_diff', '')}
            >
              Reset
            </button>
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
              onChange={(e) => handleParamChange('slope_max', e.target.value)}
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
              onChange={(e) => handleParamChange('min_area_pixels', e.target.value)}
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
              vv_threshold: null,
              vh_threshold: null,
              vv_vh_diff: null,
              slope_max: null,
              min_area_pixels: null,
              texture_window: null,
            })}
          >
            Reset All to Auto
          </button>
        </div>
      )}
    </div>
  );
}

export default AdvancedPanel;
