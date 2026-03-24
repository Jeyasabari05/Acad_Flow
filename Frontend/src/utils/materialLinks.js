import { apiUrl } from "./api";

const fileBase = apiUrl("").replace(/\/api\/?$/, "");
const VIEWER_STORAGE_PREFIX = "material-viewer-";

export const resolveMaterialUrl = (url) => {
  if (!url) return "";
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (url.startsWith("/")) return `${fileBase}${url}`;
  if (url.startsWith("uploads/")) return `${fileBase}/${url}`;
  return `${fileBase}/uploads/${url}`;
};

export const openMaterialUrl = async (url) => {
  const resolvedUrl = resolveMaterialUrl(url);
  if (!resolvedUrl) return false;

  if (resolvedUrl.startsWith("data:")) {
    const response = await fetch(resolvedUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    return true;
  }

  window.open(resolvedUrl, "_blank", "noopener,noreferrer");
  return true;
};

const triggerDownload = (href, fileName) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName || "material.pdf";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadMaterialUrl = async (url, fileName = "material.pdf") => {
  const resolvedUrl = resolveMaterialUrl(url);
  if (!resolvedUrl) return false;

  if (resolvedUrl.startsWith("data:")) {
    const response = await fetch(resolvedUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    triggerDownload(blobUrl, fileName);
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    return true;
  }

  triggerDownload(resolvedUrl, fileName);
  return true;
};

export const createMaterialViewerToken = (url, options = {}) => {
  const resolvedUrl = resolveMaterialUrl(url);
  if (!resolvedUrl) return "";

  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const payload = {
    src: resolvedUrl,
    title: options.title || "PDF Viewer",
    subtitle: options.subtitle || "",
    returnTo: options.returnTo || "",
  };
  sessionStorage.setItem(`${VIEWER_STORAGE_PREFIX}${token}`, JSON.stringify(payload));
  return token;
};

export const getMaterialViewerPayload = (token) => {
  if (!token) return null;
  const raw = sessionStorage.getItem(`${VIEWER_STORAGE_PREFIX}${token}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};
