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
