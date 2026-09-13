export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host.includes("vercel.app") ||
      host.includes("onrender.com") ||
      (!host.includes("localhost") && !host.includes("127.0.0.1"))
    ) {
      return "https://pramaan-pr4m.onrender.com";
    }
  }
  return "http://localhost:8000";
}
