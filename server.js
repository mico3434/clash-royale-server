const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

let waitingPlayer = null;
let rooms = {};

console.log(`🚀 Servidor Clash Royale activo en puerto ${PORT}`);

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'FIND_MATCH') {
                if (waitingPlayer && waitingPlayer !== ws) {
                    const roomId = `room_${Date.now()}`;
                    rooms[roomId] = { p1: waitingPlayer, p2: ws };

                    waitingPlayer.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'player1', roomId }));
                    ws.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'player2', roomId }));
                    waitingPlayer = null;
                } else {
                    waitingPlayer = ws;
                    ws.send(JSON.stringify({ type: 'WAITING', message: 'Buscando rival...' }));
                }
            }

            if (data.type === 'PLAY_CARD' && data.roomId && rooms[data.roomId]) {
                const room = rooms[data.roomId];
                const opponent = (ws === room.p1) ? room.p2 : room.p1;
                if (opponent && opponent.readyState === 1) {
                    opponent.send(JSON.stringify(data));
                }
            }
        } catch (e) {
            console.error("Error procesando mensaje:", e);
        }
    });

    ws.on('close', () => {
        if (waitingPlayer === ws) waitingPlayer = null;
    });
});
