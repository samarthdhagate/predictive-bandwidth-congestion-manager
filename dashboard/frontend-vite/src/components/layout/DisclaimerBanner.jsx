import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner">
      <span className="disclaimer-tag">CONTROLLED LAB TESTBED</span>
      <span>
        Results are generated from an isolated Linux network testbed (network namespaces & virtual routing). Zero production campus Wi-Fi hardware or live client sessions are modified.
      </span>
    </div>
  );
}
