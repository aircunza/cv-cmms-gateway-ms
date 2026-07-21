import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [AuthModule, OrganizationsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
