const { Server } = require('socket.io');

let io = '';

function websocketConnection(server) {
    io = new Server(server);

    io.on('connection', (socket) => {
        console.log('user is connected via a websocket');

        socket.on('disconnect', (socket) => {
            console.log('user is disconnected');
        });

        socket.on('join-initial-self-room', (roomCode) => {
            socket.join(roomCode);
            console.log(`room joined successfully ${roomCode}]`);
        });

        socket.on('user-enter-the-required-room', (rooms) => {
            rooms.forEach((room) => {
                socket.join(room);
                console.log(`${socket} joined room ${room}`);
            });
        });

        socket.on('leave-room', (room) => {
            socket.leave(room);
            console.log(`user has left the room ${room}`);
        });

        socket.on('update-all-user-ongoing-orders', (data) => {
            socket
                .to(data.roomCode)
                .emit(
                    'vendor-update-your-ongoing-orders',
                    data.isOrderCreated.vendorUpdates
                );
            socket.emit(
                'customer-update-your-order-queue',
                data.isOrderCreated.userUpdates
            );

            data.isOrderCreated.userUpdates.user.firstName =
                data.isOrderCreated.userUpdates.user.firstName[0];
            data.isOrderCreated.userUpdates.user.lastName =
                data.isOrderCreated.userUpdates.user.lastName[0];
            data.isOrderCreated.userUpdates.yourOrder = false;

            socket
                .to(data.roomCode)
                .emit(
                    'other-users-update-your-order-queue',
                    data.isOrderCreated.userUpdates
                );
        });

        socket.on('update-order-cancellation-indicator-to-true', (data) => {
            socket
                .to(data.roomCode)
                .emit('update-cancelled-status-to-true', data.orderId);
        });

        socket.on('update-order-cancellation-indicator-to-false', (data) => {
            socket
                .to(data.roomCode)
                .emit('update-cancelled-status-to-false', data.orderId);
        });

        socket.on('order-cancellation-is-confirmed', (data) => {
            io.to(data.roomCode).emit(
                'update-ongoing-orders-after-successfull-cancellation',
                data.orderId
            );
        });

        socket.on(
            'specific-user-update-your-cancellation-status-to-true',
            (data) => {
                socket
                    .to(data.roomCode)
                    .emit(
                        'user-update-your-cancellation-status-to-true',
                        data.orderId
                    );
            }
        );

        socket.on(
            'specific-user-update-your-cancellation-status-to-false',
            (data) => {
                socket
                    .to(data.roomCode)
                    .emit(
                        'user-update-your-cancellation-status-to-false',
                        data.orderId
                    );
            }
        );

        socket.on('users-update-the-shop-status', (roomCode) => {
            socket.to(roomCode).emit('update-shop-status');
        });

        socket.on('notify-specific-customer', (data) => {
            socket.to(data.roomCode).emit('user-update-notify-status', {
                orderId: data.orderId,
                data: data.data,
            });
            socket
                .to(data.userRoomCode)
                .emit('user-update-notify-status-in-your-ongoing-dashboard', {
                    orderId: data.orderId,
                    data: data.data,
                });
        });

        socket.on('update-process-status-for-specific-customer', (data) => {
            socket
                .to(data.roomCode)
                .emit('user-update-your-process-status', data.orderId);
            socket
                .to(data.userRoomCode)
                .emit(
                    'user-update-your-process-status-in-your-ongoing-dashboard',
                    data.orderId
                );
        });

        socket.on('reset-process-status-for-specific-customer', (data) => {
            socket
                .to(data.roomCode)
                .emit('user-reset-customer-process-status', data.orderId);
            socket
                .to(data.userRoomCode)
                .emit(
                    'user-reset-your-process-status-in-your-ongoing-dashboard',
                    data.orderId
                );
        });

        socket.on('order is completed', (data) => {
            io.to(data.roomCode).emit(
                'all-update-your-ongoing-order-as-a-order-is-completed',
                data.orderId
            );
            socket
                .to(data.userRoomCode)
                .emit(
                    'user-update-your-ongoing-order-in-your-ongoing-dashboard-as-a-order-is-completed',
                    data.orderId
                );
        });

        socket.on('update-your-unreceived-orders', (data) => {
            socket.emit('vendor-update-your-unreceived-orders', data.orderId);
            socket
                .to(data.roomCode)
                .emit('user-update-your-unreceived-orders', data.orderId);
        });
    });
}

module.exports = { websocketConnection };
