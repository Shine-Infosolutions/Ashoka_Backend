const mongoose = require('mongoose');

// Separate connection for audit logs
let auditConnection = null;

const connectAuditDB = async () => {
  try {
    if (auditConnection && auditConnection.readyState === 1) {
      return auditConnection;
    }

    // Check if AUDIT_MONGO_URI is provided, otherwise use main database
    const auditDbUri = process.env.AUDIT_MONGO_URI;
    
    if (!auditDbUri) {
      console.log('ℹ️ Using main database for audit logs');
      // Return the default mongoose connection for audit logs
      return mongoose.connection;
    }

    console.log('Connecting to audit database...');
    
    auditConnection = mongoose.createConnection(auditDbUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      maxPoolSize: 3,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      retryWrites: true,
      w: 'majority',
      family: 4
    });

    // Wait for connection with timeout (non-blocking)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️ Audit database connection timeout - using main database');
        resolve(mongoose.connection);
      }, 3000);
      
      auditConnection.once('connected', () => {
        clearTimeout(timeout);
        console.log('✅ Audit database connected successfully');
        resolve(auditConnection);
      });
      
      auditConnection.once('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ Audit database connection error:', err.message);
        console.log('ℹ️ Falling back to main database for audit logs');
        resolve(mongoose.connection);
      });
    });
  } catch (error) {
    console.error('Failed to connect to audit database:', error.message);
    console.log('ℹ️ Using main database for audit logs');
    if (auditConnection) {
      auditConnection.close();
      auditConnection = null;
    }
    return mongoose.connection;
  }
};

const getAuditConnection = async () => {
  try {
    if (!auditConnection || auditConnection.readyState !== 1) {
      auditConnection = await connectAuditDB();
    }
    return auditConnection;
  } catch (error) {
    console.error('❌ Failed to get audit connection:', error.message);
    return mongoose.connection; // Fallback to main database
  }
};

module.exports = {
  connectAuditDB,
  getAuditConnection
};