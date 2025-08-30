import * as WebSocket from 'ws';
import * as http from 'http';
import { ControlService } from './control/control.service';

export function initWebSocketServer(server: http.Server, controlService: ControlService) {
  const wss = new WebSocket.Server({ noServer: true });

  const browserClients: WebSocket[] = [];

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;

    if (pathname === '/ws' || pathname === '/client') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        // extra mezőt teszünk a socketre
        ws.path = pathname;
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy(); // elutasítjuk az ismeretlen kapcsolatot
    }
  });

  wss.on('connection', (ws: WebSocket & { path?: string }, request) => {
    const path = (ws as any).path;

    if (path === '/ws') {
      console.log('ESP32 connected');

    ws.on('message', (message, isBinary) => {
    if (isBinary) {
    browserClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: true });
      }
    });

  } else {
    // szöveges üzenet: például "get_coords"
    const msg = message.toString();

    if (msg === 'get_coords') {
      const coords = controlService.getLastCoordinates();
      ws.send(JSON.stringify(coords));
      controlService.setShootState(0); 
    } else {
      console.log('Ismeretlen üzenet:', msg);
    }
  }
});

      ws.on('close', () => {
        console.log('ESP32 disconnected');
      });

    } else if (path === '/client') {
      console.log('Frontend client connected');
      browserClients.push(ws);

      ws.on('message', (message) => {
  try {
    const data = JSON.parse(message.toString());
    if (typeof data.x === 'number' && typeof data.y === 'number') {

      // pl. tárold vagy használd fel
      controlService.setLastCoordinates(data.x, data.y);

    } else if (data.type === 'slider' && typeof data.value === 'number') {

      controlService.setZCoordinate(data.value);
      // Itt kezeld a slider értéket, pl. külön service-hez adod

    }
    else if(data.type === 'button' && typeof data.value === 'string') {
      controlService.setShootState(1);
    }
  } catch (e) {
    console.warn('Nem sikerült JSON-t olvasni a websocket üzenetből:', e);
  }
});

      ws.on('close', (code, reason) => {
        const index = browserClients.indexOf(ws);
        if (index !== -1) browserClients.splice(index, 1);
        console.log('WS kapcsolat bezárult, code:', code, 'reason:', reason.toString());
      });
    }
  });
}
