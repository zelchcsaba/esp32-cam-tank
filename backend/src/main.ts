import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as http from 'http';
import { initWebSocketServer } from './websocket.gateway';
import { ControlService } from './control/control.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
  });

  // Létrehozunk egy HTTP szervert, amit mind a NestJS, mind a WebSocket használ
  const httpServer = http.createServer(app.getHttpAdapter().getInstance());

  const controlService = app.get(ControlService);

  await app.init(); // fontos, hogy előbb init, és utána listen

  httpServer.listen(3000, '0.0.0.0', () => {
    console.log('🚀 HTTP + WS szerver fut a http://<IP>:3000 címen');

  // Indítjuk a WebSocket szervert a megfelelő HTTP szerverrel
  initWebSocketServer(httpServer, controlService);
  });
}
bootstrap();