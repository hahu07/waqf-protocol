import { withJuno } from "@junobuild/nextjs-plugin";

// Configure Turbopack root to silence workspace root warning when multiple lockfiles are present.
// We explicitly set the root to this project directory.
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default withJuno({ nextConfig });
