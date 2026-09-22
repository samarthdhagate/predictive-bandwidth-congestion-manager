/**
 * Dashboard API & Data-Service Layer
 * Encapsulates all backend communication with timeouts, health checks,
 * structured error interception, and connection state events.
 */

class DashboardAPIService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.defaultTimeoutMs = 6000;
        this.isConnected = true;
        this.lastHealthCheck = null;
    }

    /**
     * Resilient fetch with AbortController timeout handling
     */
    async fetchWithTimeout(endpoint, options = {}, timeoutMs = this.defaultTimeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    ...(options.headers || {})
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errDetail = `HTTP ${response.status}: ${response.statusText}`;
                this._notifyConnection(false, errDetail);
                throw new Error(errDetail);
            }

            const data = await response.json();
            this._notifyConnection(true, null);
            return { ok: true, data };

        } catch (error) {
            clearTimeout(timeoutId);
            let message = error.message;
            if (error.name === 'AbortError') {
                message = `Request timeout after ${timeoutMs / 1000}s`;
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                message = 'Backend server unreachable (http://127.0.0.1:8000)';
            }
            
            this._notifyConnection(false, message);
            return { ok: false, error: message, data: null };
        }
    }

    /**
     * Notify application of connection state changes
     */
    _notifyConnection(connected, error) {
        if (this.isConnected !== connected) {
            this.isConnected = connected;
            window.dispatchEvent(new CustomEvent('noc:connection-state', {
                detail: { connected, error, timestamp: new Date().toISOString() }
            }));
        }
    }

    /**
     * Backend Health Check
     */
    async checkHealth() {
        return await this.fetchWithTimeout('/api/health', {}, 3000);
    }

    /**
     * 1. System Overview Counters & ML Performance
     */
    async getSystemOverview() {
        return await this.fetchWithTimeout('/api/system/overview');
    }

    /**
     * 2. AP Congestion Spatial Grid (with floor and risk filters)
     */
    async getAPs(floor = null, risk = null) {
        const params = new URLSearchParams();
        if (floor !== null && floor !== undefined && floor !== 'all') {
            params.append('floor', floor);
        }
        if (risk !== null && risk !== undefined && risk !== 'all') {
            params.append('risk', risk);
        }
        const query = params.toString() ? `?${params.toString()}` : '';
        return await this.fetchWithTimeout(`/api/aps${query}`);
    }

    /**
     * Single AP details
     */
    async getAPDetails(apId) {
        return await this.fetchWithTimeout(`/api/aps/${apId}`);
    }

    /**
     * 4. Decision Engine Status & Policy Reason
     */
    async getDecisionStatus(apId) {
        return await this.fetchWithTimeout(`/api/decision/${apId}`);
    }

    /**
     * 3. Prediction & Testbed Latency History Time-Series
     */
    async getAPHistory(apId) {
        return await this.fetchWithTimeout(`/api/aps/${apId}/history`);
    }

    /**
     * 5. QoS Performance Benchmarks & Regime Comparisons (includes Jitter)
     */
    async getQoSBenchmarks() {
        return await this.fetchWithTimeout('/api/qos/benchmarks');
    }

    /**
     * 6. Policy Transition & Actuation Audit Logs
     */
    async getAuditLogs(limit = 100) {
        return await this.fetchWithTimeout(`/api/audit/logs?limit=${limit}`);
    }

    /**
     * System Pipeline Flow metadata
     */
    async getSystemFlow() {
        return await this.fetchWithTimeout('/api/system/flow');
    }
}

// Export singleton instance to window
window.DashboardAPI = new DashboardAPIService();
