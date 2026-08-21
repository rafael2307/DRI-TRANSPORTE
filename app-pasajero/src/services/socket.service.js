import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
    socket = null;

connect(token) {
    this.socket = io(SOCKET_URL, {
        auth: { token }
    });

    this.socket.on('unauthorized', (err) => {
        console.error('Socket no autorizado:', err?.message);
    });
}

onNearbyDrivers(callback) {
    if (this.socket) {
        this.socket.on('nearbyDrivers', callback);
    }
}

onDriverUpdate(callback) {
    if (this.socket) {
        this.socket.on('driverLocationUpdated', callback);
    }
}

onTripAccepted(callback) {
    if (this.socket) {
        this.socket.on('tripAccepted', callback);
    }
}

onDriverArrived(callback) {
    if (this.socket) {
        this.socket.on('driverArrived', callback);
    }
}

onTripStarted(callback) {
    if (this.socket) {
        this.socket.on('tripStarted', callback);
    }
}

onTripCompleted(callback) {
    if (this.socket) {
        this.socket.on('tripCompleted', callback);
    }
}

onTripCancelled(callback) {
    if (this.socket) {
        this.socket.on('tripCancelled', callback);
    }
}

sendMessage(tripId, message) {
    if (this.socket) {
        this.socket.emit('sendMessage', { tripId, message });
    }
}

onNewMessage(callback) {
    if (this.socket) {
        this.socket.on('newMessage', callback);
    }
}

requestTrip(data) {
    if (this.socket) {
        this.socket.emit('requestTrip', data);
    }
}

findDrivers(lat, lng) {
    if (this.socket) {
        this.socket.emit('findDrivers', { lat, lng });
    }
}

disconnect() {
    if (this.socket) {
        this.socket.disconnect();
    }
}

// Alerta de pánico/SOS. No depende de ninguna preferencia — siempre está
// disponible durante un viaje activo, a diferencia del chat del asistente.
sendSosAlert(tripId, lat, lng) {
    if (this.socket) {
        this.socket.emit('sosAlert', { tripId, lat, lng });
    }
}

onSosAlertTriggered(callback) {
    if (this.socket) {
        this.socket.on('sosAlertTriggered', callback);
    }
}

// Chat conversacional con el asistente de IA. Solo responde si el
// pasajero activó la preferencia (ver GET/PATCH /pasajero/assistant-preferences).
sendAssistantChatMessage(message) {
    if (this.socket) {
        this.socket.emit('assistantChatMessage', { message });
    }
}

onAssistantChatReply(callback) {
    if (this.socket) {
        this.socket.on('assistantChatReply', callback);
    }
}

onAssistantChatError(callback) {
    if (this.socket) {
        this.socket.on('assistantChatError', callback);
    }
}
}

export const socketService = new SocketService();
