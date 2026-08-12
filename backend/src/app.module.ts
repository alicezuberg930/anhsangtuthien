import { MiddlewareConsumer, Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersModule } from './modules/users/users.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthModule } from './modules/auth/auth.module'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
// import { JwtAuthGuard } from './modules/auth/passport/jwt-auth.guard'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { AllExceptionsFilter } from './common/exceptions/exception.filter'
import { PostsModule } from './modules/posts/posts.module'
import { BannersModule } from './modules/banners/banners.module'
import { FileModule } from './modules/file/file.module'
import { InformationModule } from './modules/information/information.module'
import { EventsModule } from './modules/events/events.module'
import { IpWhitelistMiddleware } from './common/middleware/ip.whitelist'
import { LogsModule } from './modules/logs/logs.module'
import { JwtAuthGuard } from './modules/auth/passport/jwt-auth.guard'
import { validateEnvironment } from './config/environment'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    InformationModule,
    PostsModule,
    FileModule,
    BannersModule,
    EventsModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IpWhitelistMiddleware).forRoutes('*')
  }
}
