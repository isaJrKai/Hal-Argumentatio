import { APIProvider } from '@vis.gl/react-google-maps';
import MapPanel from './MapPanel';
import type { Lead } from '../types';

interface MapPanelWithProviderProps {
  leads: Lead[];
  token: string | null;
  onOpenWorkQueue?: () => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidGoogleMapsKey = /^AIzaSy[A-Za-z0-9_-]{33}$/.test(API_KEY);

/**
 * Keep the Google Maps loader out of the application entry point.
 * It is only evaluated when the user opens the map workspace.
 */
export default function MapPanelWithProvider(props: MapPanelWithProviderProps) {
  if (!hasValidGoogleMapsKey) return <MapPanel {...props} />;

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <MapPanel {...props} />
    </APIProvider>
  );
}
