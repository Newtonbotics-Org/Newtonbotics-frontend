import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_API_URL = 'https://backend.test/api';
process.env.CLOUDINARY_API_SECRET = 'test-secret-only';

const { POST } = await import('../app/api/cloudinary/sign/route.js');
const originalFetch = globalThis.fetch;

const userId = '507f1f77bcf86cd799439011';

function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function mockBackend({ user, mediaAllowed = false, inventoryAllowed = user?.role === 'admin' }) {
	const calls = [];
	globalThis.fetch = async (input, init = {}) => {
		const url = String(input);
		calls.push({ url, init });
		if (url.endsWith('/auth/me')) {
			return user
				? jsonResponse({ success: true, data: { user } })
				: jsonResponse({ success: false }, 401);
		}
		if (url.endsWith('/media/upload-permission')) {
			return jsonResponse(
				{ success: mediaAllowed, data: { canUpload: mediaAllowed } },
				mediaAllowed ? 200 : 403,
			);
		}
		if (url.endsWith('/inventory/upload-permission')) {
			return jsonResponse(
				{ success: inventoryAllowed, data: { canUpload: inventoryAllowed } },
				inventoryAllowed ? 200 : 403,
			);
		}
		throw new Error(`Unexpected mocked request: ${url}`);
	};
	return calls;
}

function request(paramsToSign, accessToken = 'verified-by-backend', extraBody = {}) {
	return new Request('http://localhost/api/cloudinary/sign', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		},
		body: JSON.stringify({ ...extraBody, paramsToSign }),
	});
}

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test('rejects requests without a bearer token before contacting the backend', async () => {
	const calls = mockBackend({ user: null });
	const response = await POST(request({ folder: 'newtonbotics/profile' }, ''));

	assert.equal(response.status, 401);
	assert.equal(calls.length, 0);
});

test('rejects an invalid backend token', async () => {
	mockBackend({ user: null });
	const response = await POST(request({ folder: 'newtonbotics/profile' }));

	assert.equal(response.status, 401);
});

test('rejects unauthorized folders and roles', async () => {
	mockBackend({ user: { id: userId, role: 'student', isActive: true } });
	const response = await POST(request({
		folder: 'newtonbotics/inventory',
		resource_type: 'image',
		timestamp: Math.floor(Date.now() / 1000),
	}, 'verified-by-backend', { role: 'admin' }));

	assert.equal(response.status, 403);
});

test('rejects dangerous or mismatched upload parameters', async (t) => {
	const cases = [
		['unknown folder', { folder: 'newtonbotics/elsewhere', resource_type: 'image' }],
		['resource type mismatch', { folder: 'newtonbotics/profile', resource_type: 'raw' }],
		['unscoped public ID', { folder: 'newtonbotics/profile', resource_type: 'image', public_id: 'other-user/avatar' }],
		['overwrite enabled', { folder: 'newtonbotics/profile', resource_type: 'image', overwrite: true }],
		['notification URL', { folder: 'newtonbotics/profile', resource_type: 'image', notification_url: 'https://attacker.test/hook' }],
	];

	for (const [name, params] of cases) {
		await t.test(name, async () => {
			mockBackend({ user: { id: userId, role: 'admin', isActive: true } });
			const response = await POST(request({ ...params, timestamp: Math.floor(Date.now() / 1000) }));
			assert.equal(response.status, 400);
		});
	}
});

test('signs an authenticated project document upload with server-enforced parameters', async () => {
	const calls = mockBackend({ user: { id: userId, role: 'student', isActive: true } });
	const timestamp = Math.floor(Date.now() / 1000);
	const response = await POST(request({
		folder: 'newtonbotics/project-documents',
		resource_type: 'raw',
		timestamp,
	}));
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.match(body.signature, /^[a-f0-9]+$/);
	assert.equal(body.timestamp, timestamp);
	assert.equal(calls.length, 1);
	assert.equal(calls[0].init.headers.Authorization, 'Bearer verified-by-backend');
});

test('preserves inventory uploads for backend-authorized administrators', async () => {
	const calls = mockBackend({ user: { id: userId, role: 'admin', isActive: true } });
	const response = await POST(request({
		folder: 'newtonbotics/inventory',
		resource_type: 'image',
		timestamp: Math.floor(Date.now() / 1000),
	}));

	assert.equal(response.status, 200);
	assert.ok(calls.some(({ url }) => url.endsWith('/inventory/upload-permission')));
});

test('preserves media uploads for verified project leaders', async () => {
	const calls = mockBackend({
		user: { id: userId, role: 'team_member', isActive: true },
		mediaAllowed: true,
	});
	const response = await POST(request({
		folder: 'newtonbotics/gallery',
		resource_type: 'video',
		timestamp: Math.floor(Date.now() / 1000),
	}));

	assert.equal(response.status, 200);
	assert.ok(calls.some(({ url }) => url.endsWith('/media/upload-permission')));
});