import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

const ALLOWED_KEYS = new Set([
	// common upload params that may need signing
	'folder',
	'public_id',
	'timestamp',
	'tags',
	'context',
	'eager',
	'transformation',
	'overwrite',
	'invalidate',
	'resource_type',
	'quality',
	'background_removal',
	'notification_url',
	'upload_preset',
	'source', // upload widget often adds source=uw
	'type',
]);

export async function POST(req) {
	try {
		const body = await req.json();
		const raw = (body && body.paramsToSign) ? body.paramsToSign : body;

		// Keep only allowed, defined scalar values
		const paramsToSign = {};
		Object.entries(raw || {}).forEach(([k, v]) => {
			if (!ALLOWED_KEYS.has(k)) return;
			if (v === undefined || v === null) return;
			if (typeof v === 'object') return; // ignore nested objects/arrays in signature
			paramsToSign[k] = v;
		});

		// Ensure timestamp exists
		paramsToSign.timestamp = paramsToSign.timestamp || Math.floor(Date.now() / 1000);

		// Never sign the raw file
		delete paramsToSign.file;

		// Server-only. Never hardcode or prefix with NEXT_PUBLIC_.
		const apiSecret = process.env.CLOUDINARY_API_SECRET || (process.env.CLOUDINARY_URL ? new URL(process.env.CLOUDINARY_URL).password : undefined);
		if (!apiSecret) {
			return NextResponse.json({ error: 'Cloudinary API secret not configured' }, { status: 500 });
		}

		const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

		return NextResponse.json({ signature, timestamp: paramsToSign.timestamp });
	} catch (error) {
		console.error('Cloudinary sign error:', error);
		return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
	}
}
