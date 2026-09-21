import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.vesper.tracker",
  appName: "Vesper",
  webDir: "apk-www",
  android: {
    backgroundColor: "#000000",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
