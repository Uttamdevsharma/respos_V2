import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export const initIO = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://pos.okobiz.com'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join', (room: string) => {
      socket.join(room);
      console.log(`👥 Client ${socket.id} joined room: ${room}`);
    });

    socket.on('joinChat', (sessionToken: string) => {
      socket.join(`chat:${sessionToken}`);
      console.log(`💬 Client ${socket.id} joined live chat room: chat:${sessionToken}`);
    });

    socket.on('leaveChat', (sessionToken: string) => {
      socket.leave(`chat:${sessionToken}`);
      console.log(`💬 Client ${socket.id} left live chat room: chat:${sessionToken}`);
    });

    socket.on('joinTicket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
      console.log(`🎫 Client ${socket.id} joined ticket room: ticket:${ticketId}`);
    });

    socket.on('leaveTicket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
      console.log(`🎫 Client ${socket.id} left ticket room: ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

export const emitOrderEvent = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
    console.log(`📢 Broadcasted order event: ${event}`);
  }
};

export const emitChatEvent = (sessionToken: string, event: string, data: any): void => {
  if (io) {
    io.to(`chat:${sessionToken}`).emit(event, data);
    // Also broadcast to super admin live chat room
    io.to('super-admin:live-chat').emit(event, { sessionToken, ...data });
    io.emit(event, { sessionToken, ...data });
    console.log(`📢 Chat event '${event}' emitted for session ${sessionToken}`);
  }
};

export const emitTicketEvent = (ticketId: string, event: string, data: any): void => {
  if (io) {
    io.to(`ticket:${ticketId}`).emit(event, data);
    io.to('super-admin:support-tickets').emit(event, { ticketId, ...data });
    io.emit(event, { ticketId, ...data });
    console.log(`📢 Ticket event '${event}' emitted for ticket ${ticketId}`);
  }
};
