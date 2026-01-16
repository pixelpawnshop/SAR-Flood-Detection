import React from 'react';
import './ProgressIndicator.css';

function ProgressIndicator({ stage }) {
  const getStageInfo = () => {
    switch (stage) {
      case 'imagery':
        return { text: 'Processing imagery...', progress: 33 };
      case 'filters':
        return { text: 'Applying filters...', progress: 66 };
      case 'vectorizing':
        return { text: 'Generating results...', progress: 100 };
      default:
        return { text: 'Processing...', progress: 0 };
    }
  };

  const { text, progress } = getStageInfo();

  return (
    <div className="progress-indicator">
      <div className="progress-content">
        <div className="spinner"></div>
        <div className="progress-text">
          <strong>{text}</strong>
          <span className="progress-percent">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default ProgressIndicator;
