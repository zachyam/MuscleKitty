module.exports = {
  name: "Muscle Kitty",
  slug: "muscle-kitty",
  version: "1.0.1",
  orientation: "portrait",
  scheme: "musclekitty",
  userInterfaceStyle: "light",
  splash: {
    backgroundColor: "#F5F9EE",
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "zachyam.MuscleKitty"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#F5F9EE"
    },
    package: "zachyam.MuscleKitty"
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    eas: {
      projectId: "2e613563-a732-4584-a683-47acc719288c"
    }
  },
  plugins: [
    "expo-router"
  ]
};