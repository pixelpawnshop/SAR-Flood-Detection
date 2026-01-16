import React from 'react';
import TestAoiSelector from './TestAoiSelector';
import AdvancedPanel from './AdvancedPanel';
import './Sidebar.css';

function Sidebar({
  onAoiSelect,
  showAdvanced,
  setShowAdvanced,
  advancedParams,
  setAdvancedParams,
  onDetectWater,
  loading,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <section className="sidebar-section">
          <h2>📍 Select Test Location</h2>
          <TestAoiSelector onSelect={onAoiSelect} />
        </section>

        <section className="sidebar-section">
          <h2>✏️ Or Draw AOI</h2>
          <p className="help-text">
            Use the drawing tools on the map to create a custom Area of Interest.
            Maximum size: 50×50 km (2500 km²)
          </p>
        </section>

        <section className="sidebar-section">
          <AdvancedPanel
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            params={advancedParams}
            setParams={setAdvancedParams}
          />
        </section>

        <section className="sidebar-section">
          <button
            className="detect-button"
            onClick={onDetectWater}
            disabled={loading}
          >
            {loading ? '🔄 Processing...' : '🛰️ Detect Water'}
          </button>
        </section>

        <section className="sidebar-section info-section">
          <h3>ℹ️ How it works</h3>
          <ul>
            <li>Select or draw an Area of Interest</li>
            <li>Fetches latest Sentinel-1 SAR imagery (last 30 days)</li>
            <li>Applies adaptive water detection algorithm</li>
            <li>Results show detected water bodies in blue</li>
            <li>Download results as GeoJSON</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Sidebar;
