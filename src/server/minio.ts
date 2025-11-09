import { Client } from "minio";
import { env } from "./env";
import { getBaseUrl } from "./utils/base-url";

export const minioBaseUrl = getBaseUrl({ port: 9000 });

// Parse the MinIO endpoint properly - extract host and port
function parseMinioEndpoint(url: string): { endPoint: string; port?: number; useSSL: boolean } {
  const useSSL = url.startsWith("https://");
  const urlWithoutProtocol = url.split("://")[1] || url;
  const [host, portStr] = urlWithoutProtocol.split(":");
  
  return {
    endPoint: host || "localhost",
    port: portStr ? parseInt(portStr, 10) : (useSSL ? 443 : 9000),
    useSSL,
  };
}

const minioConfig = parseMinioEndpoint(minioBaseUrl);

// Initialize MinIO client lazily to avoid startup errors when MinIO is not configured
let _minioClient: Client | null = null;

export function getMinioClient(): Client {
  if (!_minioClient) {
    _minioClient = new Client({
      ...minioConfig,
      accessKey: env.MINIO_ROOT_USER,
      secretKey: env.MINIO_ROOT_PASSWORD,
    });
  }
  return _minioClient;
}

// Export for backward compatibility
export const minioClient = getMinioClient();
