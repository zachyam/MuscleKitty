module.exports = {
  name: "Muscle Kitty",
  slug: "muscle-kitty",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  scheme: "musclekitty",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/logo.png",
    resizeMode: "contain",
    backgroundColor: "#F5F9EE",
    width: 100,
    height: 100
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
  scheme: "musclekitty",
  plugins: [
    "expo-router"
  ]
};