/**
 * Lightweight Analytics Wrapper
 * Currently logs to console, but can be easily swapped for Mixpanel/Segment/etc.
 */
const analytics = {
    logEvent: (eventName, properties = {}) => {
        const timestamp = new Date().toISOString();
        console.log(`[Analytics] ${timestamp} - Event: ${eventName}`, properties);

        // FUTURE: If we add a backend analytics endpoint
        // api.post('/analytics/event', { eventName, properties, timestamp });
    },

    // Specific event helpers for better type safety/consistency
    trackAuth: (status, method, properties = {}) => {
        analytics.logEvent(`auth_${status}`, { method, ...properties });
    },

    trackAction: (actionName, properties = {}) => {
        analytics.logEvent(`action_${actionName}`, properties);
    }
};

export default analytics;
