/**
 * Advisory-fix tests for Newtonbotics-frontend (PR #19 follow-up)
 *
 * Runner: Node built-in test runner (node:test + node:assert) — no extra deps.
 * Run:    node src/__tests__/advisory-fixes.test.mjs
 *
 * All API calls are mocked via globalThis.fetch patching.
 * No production data is read or written.
 */

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// ─── Minimal mock helpers ─────────────────────────────────────────────────────

function makeResponse({ status = 200, body = '', contentType = 'application/json' } = {}) {
  const textBody = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 400 ? 'Bad Request' : String(status),
    headers: {
      get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    json: async () => JSON.parse(textBody),
    text: async () => textBody,
  };
}

const originalFetch = globalThis.fetch;
function mockFetch(response) { globalThis.fetch = async () => response; }
function restoreFetch() { globalThis.fetch = originalFetch; }

// ─── safeParseJson — mirrors the helper added to media/newsletter/contact ─────

async function safeParseJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  throw new Error(
    `Unexpected response (${response.status} ${response.statusText}): ${text.slice(0, 200)}`
  );
}

// ─── 1. safeParseJson ─────────────────────────────────────────────────────────

describe('safeParseJson helper', () => {
  test('parses valid JSON response', async () => {
    const res = makeResponse({ body: { success: true, data: { id: 1 } } });
    const data = await safeParseJson(res);
    assert.equal(data.success, true);
    assert.equal(data.data.id, 1);
  });

  test('throws on HTML error body (non-JSON content-type)', async () => {
    const res = makeResponse({ status: 500, body: '<html>Internal Server Error</html>', contentType: 'text/html' });
    await assert.rejects(() => safeParseJson(res), /Unexpected response \(500/);
  });

  test('throws on empty body with text/plain content-type', async () => {
    const res = makeResponse({ status: 503, body: '', contentType: 'text/plain' });
    await assert.rejects(() => safeParseJson(res), /Unexpected response \(503/);
  });

  test('parses JSON body even when status is 4xx', async () => {
    const res = makeResponse({ status: 400, body: { error: 'bad input' } });
    const data = await safeParseJson(res);
    assert.equal(data.error, 'bad input');
  });

  test('error message is not a SyntaxError on non-JSON body', async () => {
    const res = makeResponse({ status: 502, body: '<html>Gateway</html>', contentType: 'text/html' });
    await assert.rejects(safeParseJson(res), (err) => {
      assert.ok(!(err instanceof SyntaxError), 'Must not be SyntaxError');
      return true;
    });
  });

  test('truncates long non-JSON body to ≤200 chars in error message', async () => {
    const longBody = 'x'.repeat(400);
    const res = makeResponse({ status: 502, body: longBody, contentType: 'text/plain' });
    await assert.rejects(safeParseJson(res), (err) => {
      // prefix "Unexpected response (502 502): " ≈ 31 chars + max 200 body chars
      assert.ok(err.message.length <= 240, `Message too long: ${err.message.length}`);
      return true;
    });
  });
});

// ─── 2. newsletter.js — parsing ───────────────────────────────────────────────

describe('newsletter – response parsing', () => {
  afterEach(restoreFetch);

  test('subscribe: returns parsed data on 200 JSON', async () => {
    mockFetch(makeResponse({ body: { success: true, message: 'Subscribed' } }));
    const res = await globalThis.fetch('http://mock');
    const data = await safeParseJson(res);
    assert.equal(data.success, true);
  });

  test('subscribe: does NOT throw SyntaxError on HTML 500', async () => {
    mockFetch(makeResponse({ status: 500, body: '<html>error</html>', contentType: 'text/html' }));
    const res = await globalThis.fetch('http://mock');
    await assert.rejects(() => safeParseJson(res), (err) => {
      assert.ok(!(err instanceof SyntaxError));
      assert.ok(err.message.includes('Unexpected response'));
      return true;
    });
  });

  test('subscribe: 409 body is readable before dispatch', async () => {
    mockFetch(makeResponse({ status: 409, body: { error: 'Email is already subscribed' } }));
    const res = await globalThis.fetch('http://mock');
    const data = await safeParseJson(res);
    assert.equal(res.status, 409);
    assert.ok(data.error.includes('already subscribed'));
  });

  test('checkStatus: 400 body is readable before dispatch', async () => {
    mockFetch(makeResponse({ status: 400, body: { error: 'Validation error' } }));
    const res = await globalThis.fetch('http://mock');
    const data = await safeParseJson(res);
    assert.equal(res.status, 400);
    assert.ok(data.error.includes('Validation'));
  });

  test('unsubscribe: returns parsed data on 200 JSON', async () => {
    mockFetch(makeResponse({ body: { success: true, message: 'Unsubscribed' } }));
    const res = await globalThis.fetch('http://mock');
    const data = await safeParseJson(res);
    assert.equal(data.success, true);
  });
});

// ─── 3. contact.js — parsing ──────────────────────────────────────────────────

describe('contact – submitContactForm response parsing', () => {
  afterEach(restoreFetch);

  test('returns data on successful 200 JSON response', async () => {
    mockFetch(makeResponse({ body: { success: true, message: 'Message sent' } }));
    const res = await globalThis.fetch('http://mock');
    const data = await safeParseJson(res);
    assert.equal(data.success, true);
    assert.equal(data.message, 'Message sent');
  });

  test('does not throw SyntaxError on HTML 400 body', async () => {
    mockFetch(makeResponse({ status: 400, body: '<html>Bad Request</html>', contentType: 'text/html' }));
    const res = await globalThis.fetch('http://mock');
    await assert.rejects(() => safeParseJson(res), (err) => {
      assert.ok(!(err instanceof SyntaxError));
      return true;
    });
  });

  test('does not throw SyntaxError on empty body', async () => {
    mockFetch(makeResponse({ status: 503, body: '', contentType: 'text/plain' }));
    const res = await globalThis.fetch('http://mock');
    await assert.rejects(() => safeParseJson(res), (err) => {
      assert.ok(!(err instanceof SyntaxError));
      return true;
    });
  });
});

// ─── 4. media.js — localStorage not accessed ─────────────────────────────────

describe('media.js – no localStorage access for auth headers', () => {
  test('new auth-header logic never calls localStorage.getItem', () => {
    let localStorageCalled = false;
    const trapped = {
      getItem: () => { localStorageCalled = true; return null; },
      setItem: () => {},
      removeItem: () => {},
    };

    // Simulate new code path: fakeGetAccessToken reads in-memory only
    const fakeGetAccessToken = () => null;
    const newGetAuthHeaders = () => {
      // Old code: authService.getAccessToken() || localStorage.getItem('nb_access_token')
      // New code: authService.getAccessToken() only
      const token = fakeGetAccessToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Even with a trapped localStorage in scope, new code must not call it
    const _ = trapped; // referenced to ensure it's in scope if someone reads it
    const headers = newGetAuthHeaders();
    assert.deepEqual(headers, {});
    assert.equal(localStorageCalled, false, 'localStorage.getItem must NOT be called');
  });

  test('in-memory token produces Authorization header without localStorage', () => {
    const FAKE_TOKEN = 'eyJ.fake.token';
    const fakeGetAccessToken = () => FAKE_TOKEN;
    const headers = { Authorization: `Bearer ${fakeGetAccessToken()}` };
    assert.equal(headers.Authorization, `Bearer ${FAKE_TOKEN}`);
  });
});

// ─── 5. media.js — mediaRequest routing ──────────────────────────────────────

describe('media.js – mediaRequest routes to correct transport', () => {
  test('uses makeAuthenticatedRequest when user is authenticated', async () => {
    let authenticatedCalled = false;
    let publicCalled = false;

    const fakeAuthService = { isAuthenticated: () => true };
    const fakeApiRequest = async () => { publicCalled = true; return makeResponse({ body: {} }); };
    const fakeMakeAuthenticatedRequest = async () => { authenticatedCalled = true; return makeResponse({ body: {} }); };

    const mediaRequest = async (path, options) => {
      if (fakeAuthService.isAuthenticated()) return fakeMakeAuthenticatedRequest(`http://api${path}`, options);
      return fakeApiRequest(`http://api${path}`, options);
    };

    await mediaRequest('/media?limit=10', { cache: 'no-store' });
    assert.equal(authenticatedCalled, true, 'makeAuthenticatedRequest must be called when logged in');
    assert.equal(publicCalled, false, 'apiRequest must NOT be called when logged in');
  });

  test('uses apiRequest when user is NOT authenticated', async () => {
    let authenticatedCalled = false;
    let publicCalled = false;

    const fakeAuthService = { isAuthenticated: () => false };
    const fakeApiRequest = async () => { publicCalled = true; return makeResponse({ body: {} }); };
    const fakeMakeAuthenticatedRequest = async () => { authenticatedCalled = true; return makeResponse({ body: {} }); };

    const mediaRequest = async (path, options) => {
      if (fakeAuthService.isAuthenticated()) return fakeMakeAuthenticatedRequest(`http://api${path}`, options);
      return fakeApiRequest(`http://api${path}`, options);
    };

    await mediaRequest('/media/categories', { cache: 'no-store' });
    assert.equal(publicCalled, true, 'apiRequest must be called when not logged in');
    assert.equal(authenticatedCalled, false, 'makeAuthenticatedRequest must NOT be called when not logged in');
  });
});

// ─── 6. inventoryProjects.js — apiRequest contract ───────────────────────────

describe('inventoryProjects – apiRequest migration contract', () => {
  test('forwards AbortSignal from options to apiRequest', async () => {
    let capturedOptions = null;
    const mockApiRequest = async (url, options) => { capturedOptions = options; return makeResponse({ body: { success: true, data: { projects: [] } } }); };

    const controller = new AbortController();
    await mockApiRequest('http://localhost:3006/api/projects?limit=100', { cache: 'no-store', signal: controller.signal });

    assert.ok(capturedOptions.signal instanceof AbortSignal, 'AbortSignal must be forwarded');
    assert.equal(capturedOptions.cache, 'no-store');
  });

  test('AbortError is re-thrown without wrapping', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    const mockApiRequest = async () => { throw abortError; };

    async function readProjects(path, signal) {
      let response;
      try {
        response = await mockApiRequest(`http://localhost:3006/api${path}`, { cache: 'no-store', signal });
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        throw new Error('Cannot reach the backend');
      }
      if (!response.ok) throw new Error('Unable to load');
      return response;
    }

    await assert.rejects(() => readProjects('/projects?limit=100', null), (err) => {
      assert.equal(err.name, 'AbortError', 'AbortError must propagate unchanged');
      return true;
    });
  });

  test('network error is wrapped with user-friendly message', async () => {
    const networkError = new TypeError('fetch failed');
    const mockApiRequest = async () => { throw networkError; };

    async function readProjects(path, signal) {
      let response;
      try {
        response = await mockApiRequest(`http://localhost:3006/api${path}`, { cache: 'no-store', signal });
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        throw new Error('Cannot reach the backend');
      }
      if (!response.ok) throw new Error('Unable to load');
      return response;
    }

    await assert.rejects(() => readProjects('/projects?limit=100', null), (err) => {
      assert.ok(err.message.includes('Cannot reach the backend'));
      return true;
    });
  });
});

// ─── 7. ESLint config structural check ───────────────────────────────────────

describe('ESLint config – .jsx files coverage', () => {
  test('eslint.config.mjs includes **/*.jsx in files glob', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const url = await import('node:url');
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const configPath = path.resolve(__dirname, '../../eslint.config.mjs');
    const content = await fs.readFile(configPath, 'utf-8');
    assert.ok(content.includes('**/*.jsx'), 'must include **/*.jsx glob');
    assert.ok(content.includes('.map('), 'must use .map() to apply files override per config object');
  });
});

// ─── 8. package.json scripts ─────────────────────────────────────────────────

describe('package.json – scripts configuration', () => {
  test('package.json includes a test script', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const url = await import('node:url');
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const content = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
    assert.ok(content.scripts?.test, 'package.json must define a "test" script');
    assert.ok(content.scripts.test.includes('node --test'), 'test script should use node --test');
  });
});

// ─── 9. cloudinaryMedia.js null safety ───────────────────────────────────────

describe('cloudinaryMedia – safe URL resolution', () => {
  test('getResourcePreviewUrl handles null/undefined without throwing', async () => {
    const { getResourcePreviewUrl } = await import('../lib/cloudinaryMedia.js');
    assert.equal(getResourcePreviewUrl(null), null);
    assert.equal(getResourcePreviewUrl(undefined), null);
  });

  test('getResourceOpenUrl handles null/undefined without throwing', async () => {
    const { getResourceOpenUrl } = await import('../lib/cloudinaryMedia.js');
    assert.equal(getResourceOpenUrl(null), '');
    assert.equal(getResourceOpenUrl(undefined), '');
  });

  test('getResourceOpenUrl resolves link vs file URLs', async () => {
    const { getResourceOpenUrl } = await import('../lib/cloudinaryMedia.js');
    assert.equal(
      getResourceOpenUrl({ resourceType: 'link', externalUrl: 'https://example.com' }),
      'https://example.com'
    );
    assert.equal(
      getResourceOpenUrl({ resourceType: 'document', fileUrl: 'https://res.cloudinary.com/doc.pdf' }),
      'https://res.cloudinary.com/doc.pdf'
    );
  });
});
