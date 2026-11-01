import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
export declare const initIO: (server: HttpServer) => Server;
export declare const getIO: () => Server;
export declare const emitOrderEvent: (event: string, data: any) => void;
export declare const emitChatEvent: (sessionToken: string, event: string, data: any) => void;
export declare const emitTicketEvent: (ticketId: string, event: string, data: any) => void;
//# sourceMappingURL=socket.d.ts.map