/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "@amap/amap-jsapi-loader" {
  interface LoadOptions {
    key: string;
    version?: string;
    plugins?: string[];
  }
  const AMapLoader: {
    load(options: LoadOptions): Promise<any>;
  };
  export default AMapLoader;
}

interface AMapNamespace {
  Map: any;
  Marker: any;
  LngLat: any;
  Pixel: any;
  InfoWindow: any;
  PlaceSearch: any;
  Geocoder: any;
  [key: string]: any;
}

interface Window {
  AMap: AMapNamespace;
}
