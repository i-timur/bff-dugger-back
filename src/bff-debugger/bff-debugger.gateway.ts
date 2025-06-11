import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as WebSocket from 'ws';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, you should restrict this to your Chrome extension's origin
  },
})
export class BffDebuggerGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BffDebuggerGateway.name);
  private connectedClients: Set<Socket> = new Set();
  private wsServer: WebSocket.Server;

  afterInit(server: Server) {
    // Create a raw WebSocket server
    this.wsServer = new WebSocket.Server({ port: 3001 });

    this.wsServer.on('connection', (ws) => {
      this.logger.log('Raw WebSocket client connected');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.logger.log('Received message from raw WebSocket:', data);
        } catch (error) {
          this.logger.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.logger.log('Raw WebSocket client disconnected');
      });
    });
  }

  handleConnection(client: Socket) {
    this.connectedClients.add(client);
    this.logger.log(`Socket.IO client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client);
    this.logger.log(`Socket.IO client disconnected: ${client.id}`);
  }

  emitConsoleLog(data: any) {
    // Emit to Socket.IO clients
    this.server.emit('console', {
      type: 'log',
      timestamp: new Date().toISOString(),
      data,
    });

    // Emit to raw WebSocket clients
    if (this.wsServer) {
      const message = JSON.stringify({
        type: 'stdout',
        requestId: Math.random().toString(36).substring(7),
        message: data.message,
        level: data.level || 'info',
        timestamp: new Date().toISOString(),
      });

      this.wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  emitNetworkActivity(data: any) {
    // Emit to Socket.IO clients
    this.server.emit('network', data);

    // Emit to raw WebSocket clients
    if (this.wsServer) {
      const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      });

      this.wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }
}
