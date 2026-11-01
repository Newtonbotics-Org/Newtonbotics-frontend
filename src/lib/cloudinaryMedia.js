export function isCloudinaryUrl(url) {
  return typeof url === "string" && /https?:\/\/res\.cloudinary\.com\//.test(url);
}

export function transformCloudinaryUrl(url, { width, height, crop = "fill", quality = "auto", format = "auto" } = {}) {
  if (!isCloudinaryUrl(url)) return url;

  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  const transforms = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);

  return `${parts[0]}/upload/${transforms.join(",")}/${parts[1]}`;
}

/**
 * Right-size a Cloudinary image for display: auto format (AVIF/WebP), auto quality,
 * and a width cap. `c_limit` never upscales. URLs that already carry transforms
 * (e.g. gallery thumbnails) and non-Cloudinary URLs are returned unchanged.
 */
export function optimizeImageUrl(url, { width = 1600, height, crop = "limit" } = {}) {
  if (!isCloudinaryUrl(url)) return url;
  const [head, tail] = url.split("/upload/");
  if (!tail) return url;
  const firstSegment = tail.split("/")[0];
  // An existing transform segment looks like "f_auto,q_auto" or "w_720" (not "v123" or a folder).
  if (/^[a-z]{1,3}_[^/]*$/.test(firstSegment) && !/^v\d+$/.test(firstSegment)) return url;
  const dpr = 2; // render sharp on high-density screens
  const transforms = ["f_auto", "q_auto", `c_${crop}`, `w_${Math.round(width * dpr)}`];
  if (height) transforms.push(`h_${Math.round(height * dpr)}`);
  if (crop === "fill" || crop === "thumb") transforms.push("g_auto");
  return `${head}/upload/${transforms.join(",")}/${tail}`;
}

export function getResourcePreviewUrl(resource) {
  if (resource.thumbnailUrl) return transformCloudinaryUrl(resource.thumbnailUrl, { width: 600, height: 400, crop: "fill" });
  if (resource.resourceType === "image" && resource.fileUrl) {
    return transformCloudinaryUrl(resource.fileUrl, { width: 600, height: 400, crop: "fill" });
  }
  if (resource.resourceType === "video" && resource.fileUrl && isCloudinaryUrl(resource.fileUrl)) {
    return transformCloudinaryUrl(resource.fileUrl, { width: 600, height: 400, crop: "fill", format: "jpg" });
  }
  return null;
}

export function getResourceOpenUrl(resource) {
  if (resource.resourceType === "link") return resource.externalUrl;
  return resource.fileUrl || resource.externalUrl;
}
