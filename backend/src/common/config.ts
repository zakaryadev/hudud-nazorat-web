import { Module } from '@nestjs/common';
import { config } from './load-env';

config();

@Module({})
export class ConfigModuleStub {}
