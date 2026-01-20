// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add web-specific module resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'react-native-gesture-handler') {
        return {
            filePath: require.resolve('./react-native-gesture-handler.web.js'),
            type: 'sourceFile',
        };
    }
    // Fall back to default resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
