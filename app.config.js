module.exports = {
  name: "Muscle Kitty",
  slug: "muscle-kitty",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "musclekitty",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#F5F9EE"
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
      foregroundImage: "./assets/images/icon.png",
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
  scheme: "musclekitty",
  plugins: [
    "expo-router"
  ]
};