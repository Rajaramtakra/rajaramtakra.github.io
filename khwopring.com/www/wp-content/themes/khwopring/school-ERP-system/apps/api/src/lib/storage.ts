import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../config/env";

/**
 * Storage abstraction: local disk today, swappable for an S3-backed
 * implementation later without touching call sites (same interface).
 */
export interface StorageDriver {
  save(buffer: Buffer, originalName: string, subDir: string): Promise<{ filePath: string; fileName: string }>;
  resolveAbsolutePath(filePath: string): string;
}

class LocalStorageDriver implements StorageDriver {
  private readonly root = path.resolve(env.UPLOAD_DIR);

  async save(buffer: Buffer, originalName: string, subDir: string) {
    const dir = path.join(this.root, subDir);
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(originalName);
    const fileName = `${randomUUID()}${ext}`;
    const relativePath = path.join(subDir, fileName).replace(/\\/g, "/");

    fs.writeFileSync(path.join(dir, fileName), buffer);
    return { filePath: relativePath, fileName };
  }

  resolveAbsolutePath(filePath: string) {
    return path.join(this.root, filePath);
  }
}

export const storage: StorageDriver = new LocalStorageDriver();
