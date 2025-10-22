/**
 * Simple data API helper (disabled by default)
 *
 * To enable, set DATA_API_BASE_URL and DATA_API_KEY in your environment and
 * implement your own backend endpoint contract.
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  const baseUrl = process.env.DATA_API_BASE_URL;
  const apiKey = process.env.DATA_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Data API is not configured. Set DATA_API_BASE_URL and DATA_API_KEY to enable."
    );
  }

  // Placeholder: implement your own API contract as needed.
  // Example: POST to `${baseUrl}/call` with { apiId, ...options }
  throw new Error("callDataApi is not implemented for the provided backend.");
}
