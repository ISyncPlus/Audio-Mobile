import type { ConfigContext, ExpoConfig } from "expo/config";
import {
  withAndroidManifest,
  withPodfile,
  withPodfileProperties,
  withXcodeProject,
} from "expo/config-plugins";

export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  config = withPodfileProperties(config as ExpoConfig, (mod) => {
    mod.modResults["ios.deploymentTarget"] = "16.0";
    return mod;
  });
  config = withXcodeProject(config as ExpoConfig, (mod) => {
    const objects = mod.modResults.hash.project.objects;
    for (const entry of Object.values(objects.XCBuildConfiguration) as {
      buildSettings?: Record<string, string>;
    }[]) {
      if (entry.buildSettings?.IPHONEOS_DEPLOYMENT_TARGET)
        entry.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
    }
    // Expo's RN bundle script command needs quotes around its expanded file path.
    for (const phase of Object.values(objects.PBXShellScriptBuildPhase) as {
      shellScript?: string;
    }[]) {
      if (phase.shellScript)
        phase.shellScript = phase.shellScript.replace(
          /(\\n)(`[^`]*react-native-xcode\.sh[^`]*`)(\\n)/,
          '$1\\"$2\\"$3',
        );
    }
    return mod;
  });
  // Xcode 27 rejects resource pods targeting iOS versions below the app's minimum.
  config = withPodfile(config as ExpoConfig, (mod) => {
    const marker = "# AudioBlocks: align dependency resource targets with Expo";
    if (!mod.modResults.contents.includes(marker))
      mod.modResults.contents = mod.modResults.contents.replace(
        "post_install do |installer|",
        `post_install do |installer|
    ${marker}
    installer.pods_project.targets.each do |target|
      target.build_phases.each do |phase|
        if phase.respond_to?(:shell_script) && phase.name == '[CP-User] Generate app.config for prebuilt Constants.manifest'
          phase.shell_script = 'cd "$PROJECT_DIR/../.." && bash -l "$PODS_TARGET_SRCROOT/../scripts/with-node.sh" "$PODS_TARGET_SRCROOT/../scripts/getAppConfig.js" "$PWD" "$CONFIGURATION_BUILD_DIR/EXConstants.bundle"'
        end
      end
      target.build_configurations.each do |build_config|
        version = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if version && Gem::Version.new(version) < Gem::Version.new('16.0')
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
        end
      end
    end`,
      );
    return mod;
  });
  // RN's prebuilt CocoaPods file URLs fail on spaces in local checkout paths.
  if (projectRoot.includes(" "))
    config = withPodfileProperties(config as ExpoConfig, (mod) => {
      mod.modResults["ios.buildReactNativeFromSource"] = "true";
      return mod;
    });
  if (!process.env.EXPO_PUBLIC_API_URL?.startsWith("http://"))
    return config as ExpoConfig;
  // Local API development requires HTTP; HTTPS builds retain the secure defaults.
  const local = {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
      },
    },
  } as ExpoConfig;
  return withAndroidManifest(local, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (app) app.$["android:usesCleartextTraffic"] = "true";
    return mod;
  });
};
