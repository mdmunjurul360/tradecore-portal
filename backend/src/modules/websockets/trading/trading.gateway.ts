import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'trading' })
export class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TradingGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() pair: string) {
    if (pair) {
      client.join(pair);
      this.logger.log(`Client ${client.id} joined room ${pair}`);
      return { event: 'subscribed', data: pair };
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() pair: string) {
    if (pair) {
      client.leave(pair);
      this.logger.log(`Client ${client.id} left room ${pair}`);
      return { event: 'unsubscribed', data: pair };
    }
  }

  @SubscribeMessage('subscribe_user')
  handleSubscribeUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    if (userId) {
      client.join(userId);
      this.logger.log(`Client ${client.id} joined user room ${userId}`);
      return { event: 'user_subscribed', data: userId };
    }
  }

  broadcastUserOrderUpdate(userId: string, data: any) {
    this.server.to(userId).emit('user_order_update', data);
  }

  // Broadcasters to be called from other services
  broadcastOrderBookUpdate(pair: string, data: any) {
    this.server.to(pair).emit('orderbook_update', data);
  }

  broadcastTradeUpdate(pair: string, data: any) {
    this.server.to(pair).emit('trade_update', data);
  }

  broadcastPriceUpdate(pair: string, data: any) {
    this.server.to(pair).emit('price_update', data);
  }
}
