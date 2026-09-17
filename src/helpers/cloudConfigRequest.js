const { readPolicyResponseError, toPolicyFailure } = require("./policyResponseError");

function createCloudConfigRequestHandler({
  getApiUrl,
  getAuthHeader,
  proxyFetch,
  withPolicyHeaders,
  logger,
  configPath,
}) {
  return async function handleCloudConfigRequest(event) {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        // Cloud is not configured. Return a clean skip instead of throwing
        // so the renderer does not busy-loop logging errors every reconcile.
        return { success: true, data: null, skipped: "no-api-url" };      }

      const authHeader = await getAuthHeader(event);
      if (!Object.keys(authHeader).length) throw new Error("Not authenticated");

      const response = await proxyFetch(`${apiUrl}/api/${configPath}`, {
        headers: withPolicyHeaders(authHeader),
      });
      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: "Session expired",
            code: "AUTH_EXPIRED",
            status: 401,
          };
        }
        if (response.status === 503) {
          return {
            success: false,
            error: "Request timed out",
            code: "SERVER_ERROR",
            status: 503,
          };
        }
        throw await readPolicyResponseError(response, `API error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      logger?.error?.(`${configPath} fetch error:`, error);
      return toPolicyFailure(error);
    }
  };
}

module.exports = { createCloudConfigRequestHandler };
