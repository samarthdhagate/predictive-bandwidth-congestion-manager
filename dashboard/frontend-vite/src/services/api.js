/**
 * API Service Layer for Campus Wi-Fi Congestion Dashboard.
 * Interacts with the FastAPI backend at /api/* with timeouts and error handling.
 */

const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT_MS = 6000;

class ApiError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function fetchWithTimeout(endpoint, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, ...customOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...customOptions,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(customOptions.headers || {})
      }
    });
    clearTimeout(id);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new ApiError(
        `Request to ${endpoint} failed with HTTP ${response.status}: ${errorText}`,
        response.status,
        endpoint
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError(`Request to ${endpoint} timed out after ${timeout}ms`, 408, endpoint);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error connecting to ${endpoint}: ${error.message}`, 0, endpoint);
  }
}

export const apiService = {
  /**
   * Check backend health and latency status.
   */
  async getHealth() {
    return fetchWithTimeout('/health');
  },

  /**
   * High-level operational counters, model summary, and global enforcement status.
   */
  async getSystemOverview() {
    return fetchWithTimeout('/system/overview');
  },

  /**
   * List all 247 APs with optional floor and risk filtering.
   */
  async getAPs(floor = null, risk = null) {
    const params = new URLSearchParams();
    if (floor !== null && floor !== undefined && floor !== 'ALL') {
      params.append('floor', floor);
    }
    if (risk && risk !== 'ALL') {
      params.append('risk', risk);
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchWithTimeout(`/aps${qs}`);
  },

  /**
   * Single AP metadata and current predictive risk state.
   */
  async getAP(apId) {
    return fetchWithTimeout(`/aps/${apId}`);
  },

  /**
   * Stateful PolicyDecision schema conforming to decision engine specs.
   */
  async getDecision(apId) {
    return fetchWithTimeout(`/decision/${apId}`);
  },

  /**
   * Time series tracking of actual users, predicted users, latency, and loss for AP.
   */
  async getAPHistory(apId) {
    return fetchWithTimeout(`/aps/${apId}/history`);
  },

  /**
   * Validated QoS benchmark scenarios, 12-row load regimes, and candidate rate matrices.
   */
  async getQoSBenchmarks() {
    return fetchWithTimeout('/qos/benchmarks');
  },

  /**
   * Decision engine state transition and actuation audit logs.
   */
  async getAuditLogs(limit = 100) {
    return fetchWithTimeout(`/audit/logs?limit=${limit}`);
  },

  /**
   * 6-stage predictive closed-loop workflow metadata.
   */
  async getSystemFlow() {
    return fetchWithTimeout('/system/flow');
  }
};

export default apiService;
