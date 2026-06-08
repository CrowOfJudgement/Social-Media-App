import type { Server, Socket } from 'socket.io'
import chatService from '../chat.service'

class ChatEvent {
  hi = (socket: Socket) => {
    socket.emit('hi', 'hi')
  }

  sendMessage = async (socket: Socket, io: Server) => {
    socket.on('sendMessage', data => {
      chatService.sendMessage(data, socket, io)
    })
  }
}

export default new ChatEvent()
