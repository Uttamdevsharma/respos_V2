import { Server } from 'socket.io';
let io = null;
export const initIO = (server) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://pos.okobiz.com'],
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        socket.on('join', (room) => {
            socket.join(room);
            console.log(`👥 Client ${socket.id} joined room: ${room}`);
        });
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized');
    }
    return io;
};
export const emitOrderEvent = (event, data) => {
    if (io) {
        io.emit(event, data);
        console.log(`📢 Broadcasted event: ${event}`);
    }
};
//# sourceMappingURL=socket.js.map