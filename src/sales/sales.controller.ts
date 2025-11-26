import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.salesService.getAllSales(user.id);
  }

  @Get('monthly-total')
  getMonthlyTotal(
    @CurrentUser() user: { id: string },
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.salesService.getMonthlyTotal(user.id, parseInt(year), parseInt(month));
  }

  @Get('top-products')
  getTopProducts(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    return this.salesService.getTopProducts(user.id, limit ? parseInt(limit) : 5);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.salesService.getSaleById(id, user.id);
  }

  @Post()
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.salesService.createSale(user.id, createSaleDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.salesService.updateSale(id, user.id, updateSaleDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.salesService.deleteSale(id, user.id);
  }
}


