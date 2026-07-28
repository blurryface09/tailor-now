import type { CapacitorConfig } from "@capacitor/cli";

// TailorNow is fully server-rendered (Supabase auth, Paystack payments,
// order tracking APIs) so this wraps the LIVE site rather than a static
// export — a static build would break login, payments, and order status.
const config: CapacitorConfig = {
  appId: "com.tailornow.app",
  appName: "TailorNow",
  webDir: "public",
  server: {
    url: "https://tailornow.shop",
    cleartext: false,
  },
};

export default config;
