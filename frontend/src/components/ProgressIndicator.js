import React from 'react';
import './ProgressIndicator.css';

function ProgressIndicator({ stage }) {
  const getStageInfo = () => {
    switch (stage) {
      case 'coldstart':
        return { 
          text: 'Waking up backend server...', 
          subtext: 'First request may take 30-60 seconds',
          progress: 10 
        };
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

  const { text, subtext, progress } = getStageInfo();

  return (
    <div className="progress-indicator">
      <div className="progress-content">
        <div className="spinner"></div>
        <div className="progress-text">
          <strong>{text}</strong>
          {subtext && <span className="progress-subtext">{subtext}</span>}
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
