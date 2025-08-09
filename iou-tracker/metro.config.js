// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Make Metro respect package "exports" and prefer the native entry
config.resolver.unstable_enablePackageExports = true;

// Prefer react-native field when resolving
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
