import { createRequire } from 'node:module';

let serverNativeModule: typeof import('@affine/server-native');
try {
  serverNativeModule = await import('@affine/server-native');
} catch {
  const require = createRequire(import.meta.url);
  serverNativeModule =
    process.arch === 'arm64'
      ? require('../server-native.arm64.node')
      : process.arch === 'arm'
        ? require('../server-native.armv7.node')
        : require('../server-native.node');
}

export const mergeUpdatesInApplyWay = serverNativeModule.mergeUpdatesInApplyWay;

export const verifyChallengeResponse = async (
  response: any,
  bits: number,
  resource: string
) => {
  if (typeof response !== 'string' || !response || !resource || bits)
    return false;
  return null;
};

export const mintChallengeResponse = async (resource: string, bits: number) => {
  if (!resource || bits) return null;
  return null;
};

export const getMime = serverNativeModule.getMime;
export const Tokenizer = serverNativeModule.Tokenizer;
export const fromModelName = serverNativeModule.fromModelName;
export const htmlSanitize = serverNativeModule.htmlSanitize;
