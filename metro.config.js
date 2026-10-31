const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// Privy's documented package-export fixes for its wallet dependencies.
config.resolver.resolveRequest = (context, name, platform) => {
  if (name === "isows" || name.startsWith("zustand")) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      name,
      platform,
    );
  }
  if (name === "jose") {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ["browser"] },
      name,
      platform,
    );
  }
  return context.resolveRequest(context, name, platform);
};
module.exports = config;
