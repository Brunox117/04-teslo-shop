import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;
  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}
  handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      client.disconnect();
      return;
    }
    console.log(payload);
    this.messagesWsService.registerClient(client);
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }
  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }
  // message-from-client
  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    //! Emite unicamente al cliente
    // client.emit('messages-from-server', {
    //   fullName: 'Soy yo',
    //   message: payload.message || 'no-message',
    // });
    //! Emite a todos menos al cliente inicial
    // client.broadcast.emit('messages-from-server', {
    //   fullName: 'Soy yo',
    //   message: payload.message || 'no-message',
    // });
    //! Emite a todos
    this.wss.emit('messages-from-server', {
      fullName: 'Soy yo',
      message: payload.message || 'no-message',
    });
  }
}
