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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomersDto } from './dto/filter-customers.dto';
import { BulkDeleteDto } from '../common/dto/bulk-delete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query() filters: FilterCustomersDto,
  ) {
    // Se houver filtros ou paginação, usar o método com filtros
    if (filters.page || filters.limit || filters.search) {
      return this.customersService.getCustomersWithFilters(user.id, filters);
    }
    // Caso contrário, retornar todos (compatibilidade)
    return this.customersService.getAllCustomers(user.id);
  }

  @Get('search')
  search(
    @CurrentUser() user: { id: string },
    @Query('q') query: string,
  ) {
    return this.customersService.searchCustomers(user.id, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.getCustomerById(id, user.id);
  }

  @Post()
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.createCustomer(user.id, createCustomerDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.updateCustomer(id, user.id, updateCustomerDto);
  }

  @Delete('bulk')
  bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.bulkDeleteCustomers(bulkDeleteDto.ids, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.deleteCustomer(id, user.id);
  }
}


