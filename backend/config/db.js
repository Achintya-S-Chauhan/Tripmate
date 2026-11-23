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
    console.warn('⚠️ [MongoDB] MONGODB_URI is not set. Database persistence will be disabled until configured.');
    return false;
  }

  const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');
  const targetDesc = isLocal ? 'Local MongoDB (127.0.0.1:27017)' : 'MongoDB Atlas';

  console.log(`📡 [MongoDB] Attempting connection to ${targetDesc}...`);

  // Apply configurable DNS servers only for cloud/SRV connections (e.g. mongodb+srv://)
  if (!isLocal) {
    configureDns();
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    const host = conn.connection.host;
    const port = conn.connection.port ? `:${conn.connection.port}` : '';
    const dbName = conn.connection.name;
    console.log(`✅ [MongoDB] Successfully connected to ${targetDesc} [${host}${port}/${dbName}]`);
    return true;
  } catch (error) {
    // If SRV DNS query failed with ECONNREFUSED on Atlas and custom DNS was not explicitly configured, retry with public DNS fallback
    if (
      !isLocal &&
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
        console.log(`✅ [MongoDB] Successfully connected to ${targetDesc} [${conn.connection.host}/${conn.connection.name}]`);
        return true;
      } catch (retryError) {
        error = retryError;
      }
    }

    isConnected = false;
    console.error(`❌ [MongoDB] Connection to ${targetDesc} failed: ${error.message}`);
    if (isLocal) {
      console.error('💡 [Troubleshooting Local MongoDB]:');
      console.error('    1. Ensure MongoDB Community Server is installed on this PC.');
      console.error('    2. Verify the MongoDB Windows service is running:');
      console.error('       - Run in Administrator PowerShell: Start-Service MongoDB');
      console.error('       - Or run in CMD: net start MongoDB');
      console.error('    3. Alternatively, start mongod manually: mongod --dbpath <data_folder_path>');
    } else {
      console.warn('ℹ️  Tip: If using MongoDB Atlas, check that Network Access allows 0.0.0.0/0 or your current IP.');
    }
    return false;
  }
};

export const getDbStatus = () => {
  const uri = process.env.MONGODB_URI || '';
  const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');
  return {
    isConnected,
    connected: isConnected,
    type: isLocal ? 'local' : 'atlas',
    target: isLocal ? 'Local MongoDB' : 'MongoDB Atlas',
    host: mongoose.connection.host || (isLocal ? '127.0.0.1' : null),
    port: mongoose.connection.port || (isLocal ? 27017 : null),
    name: mongoose.connection.name || (isLocal ? 'tripmate' : null),
    readyState: mongoose.connection.readyState,
    status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'disconnected',
  };
};

