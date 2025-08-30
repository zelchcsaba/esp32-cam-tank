// src/app.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ControlController } from './control/control.controller';
import { ControlService } from './control/control.service';

@Module({
  imports: [/*ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend'),  // ez a frontend build mappa útvonala
      exclude: ['/api*'],  // API hívásokat ne erre irányítsa, csak a statikus fájlokat szolgálja ki
    }),*/HttpModule],
  controllers: [ControlController],
  providers: [ControlService],
})
export class AppModule {}