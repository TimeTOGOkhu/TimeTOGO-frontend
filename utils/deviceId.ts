import * as Application from 'expo-application';
import { Platform } from 'react-native';

let getFingerprint: () => Promise<string | null>;

if (typeof window !== 'undefined') {
    const fpPromise = import('@fingerprintjs/fingerprintjs').then(FingerprintJS => FingerprintJS.load());

    getFingerprint = async () => {
        const fp = await fpPromise;
        const result = await fp.get();
        return result.visitorId;
    };
} else { getFingerprint = async () => null; }

export async function getDeviceUUID(): Promise<string | null> {
    if (Platform.OS === 'android') {
        return Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
        return await Application.getIosIdForVendorAsync();
    } else if (Platform.OS === 'web') {
        return await getFingerprint();
    } else {
        return null;
  }
}
