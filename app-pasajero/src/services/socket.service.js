import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
    socket = null;

    connect(userId) {
        this.socket = io(SOCKET_URL, {
            query: { userId }
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

    sendMessage(tripId, senderId, message) {
        if (this.socket) {
            this.socket.emit('sendMessage', { tripId, senderId, message });
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
}

export const socketService = new SocketService();
