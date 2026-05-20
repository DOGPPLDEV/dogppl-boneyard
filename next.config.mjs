import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  org: "dog-ppl",
  project: "dogppl-boneyard",
  silent: !process.env.CI,
  disableLogger: true,
});
