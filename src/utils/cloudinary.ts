// ============================================================================
// CLOUDINARY HELPERS
// Utilitaires pour construire des URLs Cloudinary avec transforms
// ============================================================================

export interface CloudinaryServerStatus {
  cloudName: string | null;
  apiKeySet: boolean;
  apiSecretSet: boolean;
  fullyConfigured: boolean;
}

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  folder?: string;
  tags?: string[];
}

export interface CloudinaryTestResult {
  success: boolean;
  configured: boolean;
  cloudName?: string;
  error?: string;
  rate_limit_remaining?: number;
  rate_limit_allowed?: number;
}

const CLOUDINARY_TRANSFORM_DEFAULT = "f_auto,q_auto,c_limit,w_1600";
const CLOUDINARY_TRANSFORM_THUMB = "f_auto,q_auto,c_fill,w_200,h_200";
const CLOUDINARY_TRANSFORM_SMALL = "f_auto,q_auto,c_limit,w_400";
const CLOUDINARY_TRANSFORM_MEDIUM = "f_auto,q_auto,c_limit,w_800";

/**
 * Build a Cloudinary URL with transforms.
 * @param publicId - the public_id (e.g. "Mariages/Sophie_Marc/Dot/photo_1")
 * @param cloudName - the cloud name (e.g. "demo")
 * @param transform - optional transform string
 */
export function buildCloudinaryUrl(publicId: string, cloudName: string, transform = CLOUDINARY_TRANSFORM_DEFAULT): string {
  if (!publicId || !cloudName) return "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

export function cloudinaryThumbUrl(publicId: string, cloudName: string): string {
  return buildCloudinaryUrl(publicId, cloudName, CLOUDINARY_TRANSFORM_THUMB);
}

export function cloudinarySmallUrl(publicId: string, cloudName: string): string {
  return buildCloudinaryUrl(publicId, cloudName, CLOUDINARY_TRANSFORM_SMALL);
}

export function cloudinaryMediumUrl(publicId: string, cloudName: string): string {
  return buildCloudinaryUrl(publicId, cloudName, CLOUDINARY_TRANSFORM_MEDIUM);
}

/**
 * Extract the public_id from a Cloudinary secure_url.
 * Example: https://res.cloudinary.com/demo/image/upload/v1234/Mariages/Sophie/Dot/photo1.jpg
 *   → "Mariages/Sophie/Dot/photo1"
 */
export function publicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const u = new URL(url);
    // Path looks like: /<cloudName>/image/upload/<transform or version>/<publicId>.<ext>
    const parts = u.pathname.split("/");
    const uploadIdx = parts.findIndex(p => p === "upload");
    if (uploadIdx === -1) return null;
    let rest = parts.slice(uploadIdx + 1);
    // Skip version segment if it starts with 'v' followed by digits
    if (rest[0] && /^v\d+$/.test(rest[0])) rest = rest.slice(1);
    // Skip transform segments (containing 'w_' or 'h_' or 'c_' or 'q_' or 'f_')
    while (rest.length > 1 && /[whcqf]_/.test(rest[0])) rest = rest.slice(1);
    if (rest.length === 0) return null;
    const last = rest.join("/");
    // Remove file extension
    return last.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
}

/**
 * Check if a URL is from Cloudinary.
 */
export function isCloudinaryUrl(url: string): boolean {
  return !!(url && url.includes("res.cloudinary.com"));
}

// ============================================================================
// BACKEND API CALLS
// ============================================================================

export async function fetchCloudinaryServerStatus(): Promise<CloudinaryServerStatus> {
  const res = await fetch("/api/cloudinary/server-status");
  if (!res.ok) throw new Error("Failed to fetch Cloudinary status");
  return res.json();
}

export async function testCloudinaryConnection(): Promise<CloudinaryTestResult> {
  const res = await fetch("/api/cloudinary/test");
  if (!res.ok) throw new Error("Failed to test Cloudinary");
  return res.json();
}

export async function listCloudinaryFolder(folder: string, maxResults = 100): Promise<{ success: boolean; resources: CloudinaryResource[]; total: number; error?: string }> {
  const url = `/api/cloudinary/list?folder=${encodeURIComponent(folder)}&max_results=${maxResults}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to list Cloudinary folder");
  return res.json();
}

export async function listCloudinaryFolders(): Promise<{ success: boolean; folders: string[]; error?: string }> {
  const res = await fetch("/api/cloudinary/folders");
  if (!res.ok) throw new Error("Failed to list Cloudinary folders");
  return res.json();
}

export async function deleteCloudinaryPhoto(publicId: string, cloudName?: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, cloudName })
  });
  if (!res.ok) throw new Error("Failed to delete Cloudinary photo");
  return res.json();
}
