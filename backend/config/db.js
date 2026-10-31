import mongoose from 'mongoose';
import dns from 'node:dns';

let isConnected = false;

// Configurable DNS resolver workaround for environments (e.g. Windows c-ares) where default resolver fails SRV queries
export const configureDns = () => {
  const dnsServers = process.env.DNS_SERVERS;
  if (dnsServers) {
    const servers = dnsServers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length > 0) {
      dns.setServers(servers);
      console.log(`🌐 [DNS] Configured custom resolver servers: ${servers.join(', ')}`);
      return servers;
    }
  }
  return null;
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ [MongoDB] MONGODB_URI is not set. Real cloud persistence will be disabled until configured.');
    return false;
  }

  // Apply configurable DNS servers if specified (fixes Node querySrv ECONNREFUSED on Windows)
  configureDns();

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ [MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    // If SRV DNS query failed with ECONNREFUSED and custom DNS was not explicitly configured, retry with public DNS fallback
    if (
      !process.env.DNS_SERVERS &&
      error.message &&
      error.message.includes('querySrv ECONNREFUSED')
    ) {
      console.warn('⚠️ [DNS] Default resolver failed SRV query with ECONNREFUSED. Retrying with fallback DNS (8.8.8.8, 8.8.4.4)...');
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      try {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`✅ [MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
        return true;
      } catch (retryError) {
        error = retryError;
      }
    }

    isConnected = false;
    console.error(`❌ [MongoDB] Connection failed: ${error.message}`);
    console.warn('ℹ️  Tip: If using MongoDB Atlas, check that Network Access allows 0.0.0.0/0 or your current IP.');
    return false;
  }
};

export const getDbStatus = () => ({
  isConnected,
  connected: isConnected,
  host: mongoose.connection.host,
  name: mongoose.connection.name,
  readyState: mongoose.connection.readyState,
  status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
});

