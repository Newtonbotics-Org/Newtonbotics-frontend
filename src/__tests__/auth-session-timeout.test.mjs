import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

process.env.NEXT_PUBLIC_API_URL = 'https://backend.test/api';

const require = createRequire(import.meta.url);
const nextHeaders = require('next/headers.js');
let refreshCookie;
nextHeaders.cookies = async () => ({
  get: (name) => name === 'nb_refresh_token' && refreshCookie
    ? { value: refreshCookie }
    : undefined,
});

const { POST } = await import('../app/api/auth/session/route.js');
const originalFetch = globalThis.fetch;
const originalTimeoutDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout');

function backendResponse(body, status = 200, contentType = 'application/json') {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType },
  });
}

function request(action, payload = {}) {
  return new Request('http://localhost/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
}

function tokenPayload(accessToken = 'access-token', refreshToken = 'refresh-token') {
  return {
    success: true,
    data: {
      user: { id: 'user-1' },
      tokens: { accessToken, refreshToken, expiresIn: '1h' },
    },
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  refreshCookie = undefined;
  Object.defineProperty(AbortSignal, 'timeout', originalTimeoutDescriptor);
});

test('login succeeds, returns the access token, and stores refresh token in an HttpOnly cookie', async () => {
  let backendCall;
  globalThis.fetch = async (url, options) => {
    backendCall = { url: String(url), options };
    return backendResponse(tokenPayload());
  };

  const response = await POST(request('login', { credentials: { email: 'user@example.test' } }));
  const payload = await response.json();
  const setCookie = response.headers.get('set-cookie') || '';

  assert.equal(response.status, 200);
  assert.equal(backendCall.url, 'https://backend.test/api/auth/login');
  assert.equal(JSON.parse(backendCall.options.body).email, 'user@example.test');
  assert.ok(backendCall.options.signal instanceof AbortSignal);
  assert.equal(payload.data.tokens.accessToken, 'access-token');
  assert.equal('refreshToken' in payload.data.tokens, false);
  assert.match(setCookie, /nb_refresh_token=refresh-token/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=lax/i);
  assert.match(setCookie, /Path=\/api\/auth\/session/i);
});

test('refresh rotates the HttpOnly refresh token', async () => {
  refreshCookie = 'old-refresh-token';
  let backendBody;
  globalThis.fetch = async (_url, options) => {
    backendBody = JSON.parse(options.body);
    return backendResponse(tokenPayload('new-access-token', 'rotated-refresh-token'));
  };

  const response = await POST(request('refresh'));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(backendBody.refreshToken, 'old-refresh-token');
  assert.equal(payload.data.tokens.accessToken, 'new-access-token');
  assert.match(response.headers.get('set-cookie') || '', /nb_refresh_token=rotated-refresh-token/);
});

test('legacy migration exchanges its refresh token and stores the rotated cookie', async () => {
  let backendBody;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://backend.test/api/auth/refresh');
    backendBody = JSON.parse(options.body);
    return backendResponse(tokenPayload('migrated-access-token', 'migrated-refresh-token'));
  };

  const response = await POST(request('migrate', { refreshToken: 'legacy-refresh-token' }));

  assert.equal(response.status, 200);
  assert.equal(backendBody.refreshToken, 'legacy-refresh-token');
  assert.match(response.headers.get('set-cookie') || '', /nb_refresh_token=migrated-refresh-token/);
});

test('logout still clears the local cookie if the backend responds successfully', async () => {
  refreshCookie = 'logout-refresh-token';
  let backendBody;
  globalThis.fetch = async (_url, options) => {
    backendBody = JSON.parse(options.body);
    return backendResponse({ success: true });
  };

  const response = await POST(request('logout'));

  assert.equal(response.status, 200);
  assert.equal(backendBody.refreshToken, 'logout-refresh-token');
  assert.match(response.headers.get('set-cookie') || '', /nb_refresh_token=;/);
  assert.match(response.headers.get('set-cookie') || '', /Max-Age=0/i);
});

test('backend timeout returns a controlled 504 without upstream details', async () => {
  refreshCookie = 'valid-refresh-token';
  const controller = new AbortController();
  let requestedTimeout;
  Object.defineProperty(AbortSignal, 'timeout', {
    configurable: true,
    value: (milliseconds) => {
      requestedTimeout = milliseconds;
      return controller.signal;
    },
  });
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    throw new DOMException('private upstream response detail', 'TimeoutError');
  };

  const response = await POST(request('refresh'));
  const payload = await response.json();

  assert.equal(requestedTimeout, 10_000);
  assert.equal(response.status, 504);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(payload, { success: false, message: 'Authentication service timed out.' });
  assert.equal(JSON.stringify(payload).includes('private upstream response detail'), false);
  assert.equal(response.headers.has('set-cookie'), false);
});

test('logout clears the refresh cookie when the backend times out', async () => {
  refreshCookie = 'logout-refresh-token';
  globalThis.fetch = async () => {
    throw new DOMException('private upstream response detail', 'TimeoutError');
  };

  const response = await POST(request('logout'));

  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie') || '', /nb_refresh_token=;/);
  assert.match(response.headers.get('set-cookie') || '', /Max-Age=0/i);
});

test('backend HTTP errors keep their status and payload', async () => {
  globalThis.fetch = async () => backendResponse({ success: false, message: 'Invalid credentials.' }, 401);

  const response = await POST(request('login', { credentials: { email: 'user@example.test' } }));
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.message, 'Invalid credentials.');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('backend network errors return a generic 502', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('sensitive backend URL and request details');
  };

  const response = await POST(request('login', { credentials: { email: 'user@example.test' } }));
  const payload = await response.json();

  assert.equal(response.status, 502);
  assert.deepEqual(payload, { success: false, message: 'Unable to reach the authentication service.' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});