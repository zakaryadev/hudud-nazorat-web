import { Module } from '@nestjs/common';
import { VisitRecordsService } from './visit-records.service';
import { VisitRecordsController } from './visit-records.controller';
import { TerritoriesModule } from '../territories/territories.module';

@Module({
  imports: [TerritoriesModule],
  controllers: [VisitRecordsController],
  providers: [VisitRecordsService],
})
export class VisitRecordsModule {}
