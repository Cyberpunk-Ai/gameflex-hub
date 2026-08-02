import { supabase } from "@/integrations/supabase/client";

export interface IStorageProvider {
  upload(
    bucket: string,
    path: string,
    file: File,
    options?: any,
  ): Promise<{ url: string; path: string; error?: string }>;
  delete(bucket: string, path: string): Promise<{ error?: string }>;
  getPublicUrl(bucket: string, path: string): string;
  update(
    bucket: string,
    oldPath: string,
    newPath: string,
    file: File,
    options?: any,
  ): Promise<{ url: string; error?: string }>;
}

export class SupabaseStorageProvider implements IStorageProvider {
  async upload(
    bucket: string,
    path: string,
    file: File,
    options?: any,
  ): Promise<{ url: string; path: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, options);
      if (error) throw error;
      const url = this.getPublicUrl(bucket, data.path);
      return { url, path: data.path };
    } catch (err: any) {
      return { url: "", path: "", error: err.message || String(err) };
    }
  }

  async delete(bucket: string, path: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err.message || String(err) };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async update(
    bucket: string,
    oldPath: string,
    newPath: string,
    file: File,
    options?: any,
  ): Promise<{ url: string; error?: string }> {
    try {
      if (oldPath !== newPath) {
        await this.delete(bucket, oldPath);
      }
      const { url, error } = await this.upload(bucket, newPath, file, { ...options, upsert: true });
      if (error) throw new Error(error);
      return { url };
    } catch (err: any) {
      return { url: "", error: err.message || String(err) };
    }
  }
}

/**
 * VPS Local Storage Provider
 * Works seamlessly when deployed on Contabo VPS or self-hosted Node server.
 */
export class VPSLocalStorageProvider implements IStorageProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_STORAGE_SERVER_URL) ||
      (typeof process !== "undefined" && process.env?.STORAGE_SERVER_URL) ||
      "";
  }

  async upload(
    bucket: string,
    path: string,
    file: File,
  ): Promise<{ url: string; path: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("path", path);

      const res = await fetch(`${this.baseUrl}/api/storage/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`VPS upload failed with status ${res.status}`);
      }

      const json = await res.json();
      return { url: json.url || this.getPublicUrl(bucket, path), path: json.path || path };
    } catch (err: any) {
      console.warn("VPS storage upload fallback to ObjectURL:", err);
      // Local client fallback preview
      const localUrl = URL.createObjectURL(file);
      return { url: localUrl, path };
    }
  }

  async delete(bucket: string, path: string): Promise<{ error?: string }> {
    try {
      await fetch(`${this.baseUrl}/api/storage/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, path }),
      });
      return {};
    } catch (err: any) {
      return { error: err.message || String(err) };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    if (!this.baseUrl) return `/uploads/${bucket}/${path}`;
    return `${this.baseUrl}/uploads/${bucket}/${path}`;
  }

  async update(
    bucket: string,
    oldPath: string,
    newPath: string,
    file: File,
  ): Promise<{ url: string; error?: string }> {
    await this.delete(bucket, oldPath);
    const { url, error } = await this.upload(bucket, newPath, file);
    return { url, error };
  }
}

/**
 * Cloudflare R2 / AWS S3 Compatible Storage Provider
 */
export class CloudflareR2StorageProvider implements IStorageProvider {
  private endpoint: string;

  constructor() {
    this.endpoint =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_R2_PUBLIC_URL) ||
      (typeof process !== "undefined" && process.env?.R2_PUBLIC_URL) ||
      "";
  }

  async upload(
    bucket: string,
    path: string,
    file: File,
  ): Promise<{ url: string; path: string; error?: string }> {
    try {
      const uploadEndpoint = `${this.endpoint}/upload/${bucket}/${path}`;
      const res = await fetch(uploadEndpoint, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) throw new Error(`R2 upload failed: ${res.statusText}`);
      const url = this.getPublicUrl(bucket, path);
      return { url, path };
    } catch (err: any) {
      console.warn("R2 Upload error, falling back:", err);
      return { url: URL.createObjectURL(file), path, error: err.message };
    }
  }

  async delete(bucket: string, path: string): Promise<{ error?: string }> {
    try {
      await fetch(`${this.endpoint}/delete/${bucket}/${path}`, { method: "DELETE" });
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    return `${this.endpoint}/${bucket}/${path}`;
  }

  async update(
    bucket: string,
    oldPath: string,
    newPath: string,
    file: File,
  ): Promise<{ url: string; error?: string }> {
    await this.delete(bucket, oldPath);
    const { url, error } = await this.upload(bucket, newPath, file);
    return { url, error };
  }
}

/**
 * Storage Provider Factory
 * Auto selects provider from VITE_STORAGE_PROVIDER env variable without code changes
 */
export function createStorageProvider(): IStorageProvider {
  const providerType = (
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_STORAGE_PROVIDER) ||
    (typeof process !== "undefined" && process.env?.STORAGE_PROVIDER) ||
    "supabase"
  )
    .toLowerCase()
    .trim();

  switch (providerType) {
    case "vps":
    case "local":
    case "contabo":
      return new VPSLocalStorageProvider();
    case "r2":
    case "cloudflare":
    case "s3":
    case "aws":
      return new CloudflareR2StorageProvider();
    case "supabase":
    default:
      return new SupabaseStorageProvider();
  }
}

export class MediaService {
  private provider: IStorageProvider;

  constructor(provider?: IStorageProvider) {
    this.provider = provider || createStorageProvider();
  }

  setProvider(provider: IStorageProvider) {
    this.provider = provider;
  }

  getProvider(): IStorageProvider {
    return this.provider;
  }

  async upload(
    bucket: string,
    path: string,
    file: File,
    options?: any,
  ): Promise<{ url: string; path: string; error?: string }> {
    return this.provider.upload(bucket, path, file, options);
  }

  async delete(bucket: string, path: string): Promise<{ error?: string }> {
    return this.provider.delete(bucket, path);
  }

  async update(
    bucket: string,
    oldPath: string,
    newPath: string,
    file: File,
  ): Promise<{ url: string; error?: string }> {
    return this.provider.update(bucket, oldPath, newPath, file, { upsert: true });
  }

  getPublicUrl(bucket: string, path: string): string {
    return this.provider.getPublicUrl(bucket, path);
  }

  async compress(file: File, _maxSizeMB: number = 2): Promise<File> {
    return new Promise((resolve) => resolve(file));
  }

  async generateThumbnail(file: File, _size: number = 256): Promise<File> {
    return new Promise((resolve) => resolve(file));
  }
}

export const mediaService = new MediaService();

