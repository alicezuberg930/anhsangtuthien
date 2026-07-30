import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import express, { NextFunction, Request, Response } from 'express'
import { ExpressAdapter } from '@nestjs/platform-express'
import { INestApplication } from '@nestjs/common'

const server = express()
let app: INestApplication | null = null

async function bootstrap() {
  if (app) return app

  app = await NestFactory.create(AppModule, new ExpressAdapter(server))
  const configService = app.get(ConfigService)
  const cspValue = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', cspValue)
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  })

  // Enable trust proxy to handle X-Forwarded-For headers
  app.getHttpAdapter().getInstance().enable('trust proxy')
  // set prefix for every endpoint to api/v1
  app.setGlobalPrefix('api/v1', { exclude: [''] })
  // whitelist configured fields and throw error for non whitelisted fields
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true
  }))
  // cors configurations - allow origins from environment variable or defaults
  const allowedOrigins = [
    // 'http://localhost:5173',
    'https://www.anhsangtuthien.com',
  ]
  const corsOrigins = configService.get<string>('CORS_ORIGINS')
  if (corsOrigins) {
    allowedOrigins.push(...corsOrigins.split(',').map(origin => origin.trim()))
  }
  app.enableCors({
    origin: allowedOrigins,
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false,
    'credentials': true,
  })

  await app.init()
  return app
}

const isVercel = Boolean(process.env.VERCEL)

if (!isVercel) {
  bootstrap().then(app => app.listen(4000))
}

export default async function handler(req: Request, res: Response) {
  await bootstrap()
  return server(req, res)
}
