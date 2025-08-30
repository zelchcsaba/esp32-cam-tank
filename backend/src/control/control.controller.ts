import { Controller, Get, Post, Body } from '@nestjs/common';
import { ControlService } from './control.service';

@Controller('control')
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  @Post()
  handleJoystick(@Body() body: { x: number; y: number }) {
    this.controlService.setLastCoordinates(body.x, body.y);
    return { status: 'received' };
  }

  @Get()
  getLastJoystickPosition() {
    return this.controlService.getLastCoordinates();
  }
}