import { Module } from '@nestjs/common';
import { ConfigModuleStub } from './common/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TerritoriesModule } from './territories/territories.module';
import { AttendanceModule } from './attendance/attendance.module';
import { VisitRecordsModule } from './visit-records/visit-records.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModuleStub,
    PrismaModule,
    AuthModule,
    UsersModule,
    TerritoriesModule,
    AttendanceModule,
    VisitRecordsModule,
    FilesModule,
  ],
})
export class AppModule {}
