import { registerDecorator, type ValidationOptions } from "class-validator";

export function StartWith(prefix: string, validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'startWith',
      target: object.constructor,
      propertyName, 
      options: validationOptions,
      validator: {
        validate(value: string) {
          return typeof value === 'string' && value.startsWith(prefix);
        },
        defaultMessage() {
          return `The value must start with ${prefix}`;
        }
      }
    });
  }
}