import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initIO } from './config/socket.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const server = http.createServer(app);
initIO(server);
const startServer = async () => {
    await connectDB();
    server.listen(env.PORT, () => {
        console.log(`🚀 GastroFlow POS Server running on port ${env.PORT}`);
        console.log(`📡 API: http://localhost:${env.PORT}/api`);
        console.log(`🏥 Health: http://localhost:${env.PORT}/api/health`);
    });
};
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map