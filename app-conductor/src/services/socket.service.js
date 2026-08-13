import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Update with your local IP for physical device testing

class SocketService {
    socket = null;

    connect(userId) {
        this.socket = io(SOCKET_URL, {
            query: { userId }
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });
    }

    onNewTripRequest(callback) {
        if (this.socket) {
            this.socket.on('newTripRequest', callback);
        }
    }

    acceptTrip(data) {
        if (this.socket) {
            this.socket.emit('acceptTrip', data);
        }
    }

    driverArrived(tripId) {
        if (this.socket) {
            this.socket.emit('driverArrived', { tripId });
        }
    }

    startTrip(tripId) {
        if (this.socket) {
            this.socket.emit('startTrip', { tripId });
        }
    }

    completeTrip(tripId) {
        if (this.socket) {
            this.socket.emit('completeTrip', { tripId });
        }
    }

    cancelTrip(tripId, reason) {
        if (this.socket) {
            this.socket.emit('cancelTrip', { tripId, reason });
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

    updateLocation(driverId, lat, lng, serviceType) {
        if (this.socket) {
            this.socket.emit('updateLocation', {
                driverId,
                lat,
                lng,
                role: 'driver',
                serviceType
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export const socketService = new SocketService();
