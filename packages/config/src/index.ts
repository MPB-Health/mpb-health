// Environment configuration
export { env, getEnv, isProduction, isDevelopment } from './env';

// Constants
export { 
  COMPANY, 
  DOMAINS, 
  FEATURES, 
  DEV_PORTS, 
  PORTALS, 
  getPortalUrl,
  type PortalKey,
  type PortalInfo,
} from './constants';

// Feature flags
export { featureFlags, isFeatureEnabled } from './features';
