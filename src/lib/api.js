/**
 * Backend API base URL from environment (.env).
 * Set NEXT_PUBLIC_API_URL to match your server PORT, e.g. http://localhost:YOUR_PORT/api
 */
export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) {
    console.error(
      'NEXT_PUBLIC_API_URL is not set in .env. ' +
        'Add it to match your backend server, e.g. NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT/api'
    );
    return 'http://API_URL_NOT_SET/api';
  }

  return raw.replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();
