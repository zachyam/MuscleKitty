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
    bundleIdentifier: "com.yourcompany.musclekitty"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#F5F9EE"
    },
    package: "com.yourcompany.musclekitty"
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    eas: {
      projectId: "your-eas-project-id"
    }
  },
  scheme: "musclekitty",
  plugins: [
    "expo-router"
  ]
};