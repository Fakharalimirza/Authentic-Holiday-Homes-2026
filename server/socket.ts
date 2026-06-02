import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Redis Adapter template for future horizontal scaling configuration:
  /*
  import { createClient } from "redis";
  import { createAdapter } from "@socket.io/redis-adapter";
  
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io!.adapter(createAdapter(pubClient, subClient));
      console.log("[Socket.io Scaling] Redis adapter successfully connected & mapped.");
    }).catch(err => {
      console.error("[Socket.io Scaling] Failed to initialize Redis cluster link; scaling degraded to standard VPS memory fallback.", err);
    });
  }
  */

  io.on("connection", (socket: Socket) => {
    const { userId, role } = socket.handshake.query;
    
    if (userId && typeof userId === "string") {
      socket.join(`user_${userId}`);
      console.log(`[Socket.io] Connection bounds established for user_${userId}`);
    } else {
      console.log(`[Socket.io] Anonymous connection handoff: ${socket.id}`);
    }

    if (role && typeof role === "string") {
      const isStaff = ['super_admin', 'admin', 'agent', 'maintenance', 'host', 'landlord'].includes(role);
      if (isStaff) {
        socket.join("staff");
        console.log(`[Socket.io] Staff permission room attached for user ${userId || "anonymous"}`);
      }
    }

    // Explicit manual registration event handler
    socket.on("register_user", (data: { userId: string; role?: string }) => {
      if (data.userId) {
        socket.join(`user_${data.userId}`);
        console.log(`[Socket.io] Manual register successfully processed: user_${data.userId}`);
      }
      if (data.role) {
        const isStaff = ['super_admin', 'admin', 'agent', 'maintenance', 'host', 'landlord'].includes(data.role);
        if (isStaff) {
          socket.join("staff");
          console.log(`[Socket.io] Staff flag manual room mappings verified.`);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Socket session complete: ${socket.id}`);
    });
  });

  console.log("[Socket.io] Real-time event layer successfully bound to Core VPS Node.");
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Target helper emitters
export function emitToUser(userId: string, eventName: string, payload: any) {
  if (io) {
    io.to(`user_${userId}`).emit(eventName, payload);
  }
}

export function emitToStaff(eventName: string, payload: any) {
  if (io) {
    io.to("staff").emit(eventName, payload);
  }
}

export function emitToAll(eventName: string, payload: any) {
  if (io) {
    io.emit(eventName, payload);
  }
}
