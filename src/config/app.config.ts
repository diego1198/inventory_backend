import { ConfigService } from '@nestjs/config';

export const getAppConfig = (configService: ConfigService) => ({
  port: configService.get<number>('port'),
  name: configService.get<string>('app.name'),
  version: configService.get<string>('app.version'),
  environment: configService.get<string>('app.environment'),
});
