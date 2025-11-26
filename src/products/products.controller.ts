import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.productsService.getAllProducts(user.id);
  }

  @Get('low-stock')
  findLowStock(@CurrentUser() user: { id: string }) {
    return this.productsService.getLowStockProducts(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.getProductById(id, user.id);
  }

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.createProduct(user.id, createProductDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.updateProduct(id, user.id, updateProductDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.deleteProduct(id, user.id);
  }
}


