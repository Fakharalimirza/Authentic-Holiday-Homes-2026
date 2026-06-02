import { useState, useEffect } from 'react';

export interface UserLocation {
  city?: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  isProxyOrVpn?: boolean;
  source: 'ip' | 'gps' | 'fallback';
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>({
    city: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    lat: 25.1972,
    lng: 55.2744,
    timezone: 'Asia/Dubai',
    isProxyOrVpn: false,
    source: 'fallback',
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function detectIPLocation() {
      try {
        setLoading(true);
        // Silently fetch IP-based general location details
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('IP geolocation endpoint returned non-ok status');
        }
        const data = await response.json();

        // Detect system browser timezone
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // A mismatch between browser system timezone and the IP registered timezone is a very strong proxy/VPN indicator
        const timezoneMismatch = browserTimezone && data.timezone && (browserTimezone.toLowerCase() !== data.timezone.toLowerCase());

        setLocation({
          city: data.city || 'Dubai',
          country: data.country_name || 'United Arab Emirates',
          countryCode: data.country || 'AE',
          lat: typeof data.latitude === 'number' ? data.latitude : 25.1972,
          lng: typeof data.longitude === 'number' ? data.longitude : 55.2744,
          timezone: data.timezone || 'Asia/Dubai',
          isProxyOrVpn: Boolean(timezoneMismatch),
          source: 'ip',
        });
      } catch (err) {
        console.warn('IP Geolocation error: falling back to UAE center.', err);
        // Safe, non-intrusive Dubai fallback
        setLocation({
          city: 'Dubai',
          country: 'United Arab Emirates',
          countryCode: 'AE',
          lat: 25.1972,
          lng: 55.2744,
          timezone: 'Asia/Dubai',
          isProxyOrVpn: false,
          source: 'fallback',
        });
      } finally {
        setLoading(false);
      }
    }

    detectIPLocation();
  }, []);

  // Request high precision GPS coordinate logs only on user click request
  const requestGPSLocation = () => {
    return new Promise<UserLocation>((resolve, reject) => {
      if (!navigator.geolocation) {
        const errMsg = 'Geolocation API is not supported by your browser';
        setErrorMsg(errMsg);
        reject(errMsg);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const gpsLocation: UserLocation = {
            city: 'Current Coordinates',
            country: 'Locally Determined',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timezone: browserTimezone,
            isProxyOrVpn: false, // GPS is physically exact
            source: 'gps',
          };
          setLocation(gpsLocation);
          setErrorMsg('');
          resolve(gpsLocation);
        },
        (error) => {
          let msg = 'Failed to acquire location dimensions.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please adjust your web settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Physical position details are currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'GPS tracking timeout reached.';
          }
          setErrorMsg(msg);
          reject(msg);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  return {
    location,
    loading,
    errorMsg,
    requestGPSLocation,
    resetToIPDefaults: () => {
      setLocation({
        city: 'Dubai',
        country: 'United Arab Emirates',
        countryCode: 'AE',
        lat: 25.1972,
        lng: 55.2744,
        timezone: 'Asia/Dubai',
        isProxyOrVpn: false,
        source: 'fallback',
      });
      setErrorMsg('');
    }
  };
}
