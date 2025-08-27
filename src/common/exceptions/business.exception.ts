import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class InsufficientStockException extends BusinessException {
  constructor(productName: string) {
    super(`Stock insuficiente para el producto: ${productName}`, HttpStatus.BAD_REQUEST);
  }
}

export class ProductNotFoundException extends BusinessException {
  constructor(productId: string) {
    super(`Producto no encontrado: ${productId}`, HttpStatus.NOT_FOUND);
  }
}

export class UserNotFoundException extends BusinessException {
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`, HttpStatus.NOT_FOUND);
  }
}
