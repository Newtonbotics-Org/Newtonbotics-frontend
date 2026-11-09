import { NextResponse } from 'next/server.js';
import { v2 as cloudinary } from 'cloudinary';
import { API_BASE_URL } from '../../../../lib/api.js';

export const runtime = 'nodejs';

const MAX_CLOCK_SKEW_SECONDS = 5 * 60;
const UPLOAD_POLICIES = {
	'newtonbotics/profile': { resourceTypes: ['image'], authorization: 'member' },
	'newtonbotics/project-documents': { resourceTypes: ['raw'], authorization: 'member' },
	'newtonbotics/inventory': { resourceTypes: ['image'], authorization: 'admin' },
	'newtonbotics/gallery': { resourceTypes: ['image', 'video'], authorization: 'media' },
	'newtonbotics/media': { resourceTypes: ['image', 'video', 'raw'], authorization: 'media' },
	'newtonbotics/uploads': { resourceTypes: ['image', 'video', 'raw'], authorization: 'media' },
};

const ALLOWED_KEYS = new Set([
	'folder', 'public_id', 'timestamp', 'tags', 'context', 'eager',
	'transformation', 'overwrite', 'invalidate', 'resource_type', 'quality',
	'background_removal', 'notification_url', 'upload_preset', 'source', 'type',
]);

async function backendJson(path, accessToken) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: { Authorization: `Bearer ${accessToken}` },
		cache: 'no-store',
		signal: AbortSignal.timeout(8000),
	});
	let payload;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}
	return { response, payload };
}

async function verifyUser(accessToken) {
	if (!API_BASE_URL) return { error: 'unavailable' };
	try {
		const { response, payload } = await backendJson('/auth/me', accessToken);
		if (response.status === 401 || response.status === 403) return { error: 'unauthorized' };
		if (!response.ok || payload?.success !== true) return { error: 'unavailable' };
		const user = payload.data?.user;
		if (!user?.id || user.isActive !== true) return { error: 'unauthorized' };
		return { user };
	} catch {
		return { error: 'unavailable' };
	}
}

async function canManageMedia(accessToken) {
	try {
		const { response, payload } = await backendJson('/media/upload-permission', accessToken);
		return response.ok && payload?.success === true && payload.data?.canUpload === true;
	} catch {
		return false;
	}
}

async function canManageInventory(accessToken) {
	try {
		const { response, payload } = await backendJson('/inventory/upload-permission', accessToken);
		return response.ok && payload?.success === true && payload.data?.canUpload === true;
	} catch {
		return false;
	}
}

async function isAuthorized(policy, accessToken) {
	if (policy.authorization === 'member') return true;
	if (policy.authorization === 'admin') return canManageInventory(accessToken);
	if (policy.authorization === 'media') return canManageMedia(accessToken);
	return false;
}

function badRequest(message) {
	return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req) {
	const authorization = req.headers.get('authorization') || '';
	const accessToken = authorization.match(/^Bearer ([^\s]+)$/i)?.[1];
	if (!accessToken) {
		return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
	}

	const auth = await verifyUser(accessToken);
	if (auth.error === 'unavailable') {
		return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
	}
	if (auth.error) {
		return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await req.json();
		const raw = (body && body.paramsToSign) ? body.paramsToSign : body;
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
			return badRequest('Upload parameters are invalid');
		}

		const folder = raw.folder;
		const policy = UPLOAD_POLICIES[folder];
		if (!policy) return badRequest('Upload folder is not allowed');
		if (!(await isAuthorized(policy, accessToken))) {
			return NextResponse.json({ error: 'Upload is not authorized' }, { status: 403 });
		}

		if (Object.hasOwn(raw, 'notification_url')) {
			return badRequest('Notification URLs are not allowed');
		}
		if (Object.hasOwn(raw, 'upload_preset')) {
			return badRequest('Upload presets are not allowed');
		}
		if (raw.resource_type !== undefined && !policy.resourceTypes.includes(raw.resource_type)) {
			return badRequest('Resource type is not allowed for this folder');
		}
		if (raw.type !== undefined && raw.type !== 'upload') {
			return badRequest('Upload type is not allowed');
		}
		if (raw.overwrite !== undefined && raw.overwrite !== false && raw.overwrite !== 'false') {
			return badRequest('Overwriting uploads is not allowed');
		}
		if (raw.public_id !== undefined) {
			const publicIdPrefix = `${auth.user.id}/`;
			if (
				typeof raw.public_id !== 'string' ||
				!raw.public_id.startsWith(publicIdPrefix) ||
				!/^[A-Za-z0-9][A-Za-z0-9/_-]{0,119}$/.test(raw.public_id) ||
				raw.public_id.includes('..')
			) {
				return badRequest('Public ID must be scoped to the authenticated user');
			}
		}

		const resourceType = raw.resource_type || policy.resourceTypes[0];
		const timestamp = Number(raw.timestamp);
		const now = Math.floor(Date.now() / 1000);
		if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > MAX_CLOCK_SKEW_SECONDS) {
			return badRequest('Upload timestamp is invalid or expired');
		}

		// Keep only allowed, defined scalar values
		const paramsToSign = {};
		Object.entries(raw || {}).forEach(([k, v]) => {
			if (!ALLOWED_KEYS.has(k)) return;
			if (v === undefined || v === null) return;
			if (typeof v === 'object') return; // ignore nested objects/arrays in signature
			paramsToSign[k] = v;
		});

		paramsToSign.folder = folder;
		paramsToSign.resource_type = resourceType;
		paramsToSign.timestamp = timestamp;
		paramsToSign.overwrite = false;

		// Server-only. Never hardcode or prefix with NEXT_PUBLIC_.
		const apiSecret = process.env.CLOUDINARY_API_SECRET || (process.env.CLOUDINARY_URL ? new URL(process.env.CLOUDINARY_URL).password : undefined);
		if (!apiSecret) {
			return NextResponse.json({ error: 'Cloudinary API secret not configured' }, { status: 500 });
		}

		const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

		return NextResponse.json({ signature, timestamp: paramsToSign.timestamp }, {
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error) {
		console.error('Cloudinary sign error:', error?.name || 'UnknownError');
		return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
	}
}
