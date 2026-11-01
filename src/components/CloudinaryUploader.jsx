"use client";

import { useState, useCallback, useEffect } from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUD_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

export default function CloudinaryUploader({
	onUploadComplete,
	label = "Upload Media",
	folder = "newtonbotics/uploads",
	resourceType = "image",
	cropping = false,
	multiple = false,
	showPreview = true,
	previewWidth = 300,
	previewHeight = 300,
	maxFileSizeBytes, // optional limit; e.g., 5 * 1024 * 1024
	renderTrigger, // optional: custom trigger render function: ({ open }) => JSX
}) {
	const [lastResult, setLastResult] = useState(null);
	const [error, setError] = useState("");
	
	// Suppress DataCloneError from Cloudinary widget (harmless error)
	useEffect(() => {
		const handleError = (e) => {
			// Suppress DataCloneError related to PointerEvent from Cloudinary widget
			if (e.message && typeof e.message === 'string' && 
			    (e.message.includes('DataCloneError') || e.message.includes('PointerEvent')) &&
			    e.filename && e.filename.includes('cloudinary.com')) {
				e.preventDefault();
				e.stopPropagation();
				return true; // Indicate error was handled
			}
		};
		
		// Also catch unhandled promise rejections
		const handleUnhandledRejection = (e) => {
			if (e.reason && typeof e.reason === 'object' && 
			    e.reason.message && e.reason.message.includes('DataCloneError')) {
				e.preventDefault();
				return true;
			}
		};
		
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);
		
		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	}, []);

	// Helper function to extract filename from public_id
	const extractFilenameFromPublicId = (publicId, format) => {
		if (!publicId) return 'Document';
		const parts = publicId.split('/');
		const filename = parts[parts.length - 1];
		return format ? `${filename}.${format}` : filename;
	};

	const handleSuccess = useCallback(
		(result) => {
			setError("");
			const info = result?.info || result;
			if (!info?.public_id) return;
			const payload = {
				publicId: info.public_id,
				secureUrl: info.secure_url || info.url,
				url: info.url || info.secure_url,
				width: info.width,
				height: info.height,
				format: info.format,
				resourceType: info.resource_type,
				bytes: info.bytes,
				originalName: info.original_filename || extractFilenameFromPublicId(info.public_id, info.format),
			};
			setLastResult(payload);
			onUploadComplete && onUploadComplete(payload);
		},
		[onUploadComplete]
	);

	const handleError = useCallback((err) => {
		// Ignore DataCloneError from Cloudinary widget (harmless)
		if (err?.message?.includes('DataCloneError') || err?.message?.includes('PointerEvent')) {
			console.warn('Cloudinary widget DataCloneError (can be safely ignored):', err);
			return;
		}
		const message = err?.statusText || err?.message || "Upload failed";
		setError(message);
	}, []);

	return (
		<div className="flex flex-col gap-2">
			<CldUploadWidget
				options={{
					cloudName: CLOUD_NAME,
					apiKey: CLOUD_API_KEY,
					folder,
					resourceType,
					cropping,
					multiple,
					...(maxFileSizeBytes ? { maxFileSize: maxFileSizeBytes } : {}),
				}}
				uploadPreset={undefined}
				signatureEndpoint="/api/cloudinary/sign"
				apiKey={CLOUD_API_KEY}
				onUpload={handleSuccess}
				onSuccess={handleSuccess}
				onError={handleError}
			>
				{({ open }) => {
					// Wrap open function to prevent event object cloning issues
					const handleOpen = (e) => {
						if (e) {
							e.preventDefault();
							e.stopPropagation();
						}
						open();
					};
					
					return renderTrigger ? (
						renderTrigger({ open: handleOpen })
					) : (
						<button
							type="button"
							onClick={handleOpen}
							className="nb-btn nb-btn-sm nb-btn-secondary"
						>
							{label}
						</button>
					);
				}}
			</CldUploadWidget>

			{error ? <span role="alert" className="text-xs text-[#B91C1C]">{error}</span> : null}

			{showPreview && lastResult?.publicId ? (
				<div className="mt-2">
					<CldImage
						src={lastResult.publicId}
						width={previewWidth}
						height={previewHeight}
						alt="Upload preview"
					/>
				</div>
			) : null}
		</div>
	);
}
