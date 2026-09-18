import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL;

const nextConfig: NextConfig = {
    images: {
        remotePatterns: r2PublicUrl
            ? [
                {
                    protocol: "https",
                    hostname: new URL(r2PublicUrl).hostname,
                },
            ]
            : [],
    },
    // Меньше параллельных пререндеров = меньше одновременных запросов к БД.
    // Retry ловит транзиентные ECONNRESET на Windows / Neon.
    experimental: {
        staticGenerationRetryCount: 3,
        staticGenerationMaxConcurrency: 2,
        staticGenerationMinPagesPerWorker: 50,
    },
};

export default nextConfig;
