import React, { useState } from 'react';
import testAois from '../data/testAois.json';
import './TestAoiSelector.css';

function TestAoiSelector({ onSelect }) {
  const [selectedId, setSelectedId] = useState('');

  const handleSelect = (e) => {
    const id = parseInt(e.target.value);
    setSelectedId(id);

    if (id) {
      const aoi = testAois.find(a => a.id === id);
      if (aoi) {
        onSelect(aoi);
      }
    } else {
      onSelect(null);
    }
  };

  return (
    <div className="test-aoi-selector">
      <select value={selectedId} onChange={handleSelect} className="aoi-dropdown">
        <option value="">-- Select a test location --</option>
        {testAois.map(aoi => (
          <option key={aoi.id} value={aoi.id}>
            {aoi.name}
          </option>
        ))}
      </select>

      {selectedId && (
        <div className="aoi-description">
          {testAois.find(a => a.id === selectedId)?.description}
        </div>
      )}
    </div>
  );
}

export default TestAoiSelector;
