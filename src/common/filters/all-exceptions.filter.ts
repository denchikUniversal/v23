import { Catch, HttpException, Logger, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    this.logger.error(`Status: ${status} Error: ${message}`);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    })
  }
}