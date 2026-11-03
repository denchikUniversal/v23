import { createParamDecorator, type  ExecutionContext } from "@nestjs/common";

export const UserAgent = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.headers['user-agent'];
  }
);