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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoriesDto } from './dto/filter-categories.dto';
import { BulkDeleteDto } from '../common/dto/bulk-delete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query() filters: FilterCategoriesDto,
  ) {
    // Se houver filtros ou paginação, usar o método com filtros
    if (filters.page || filters.limit || filters.search) {
      return this.categoriesService.getCategoriesWithFilters(user.id, filters);
    }
    // Caso contrário, retornar todos (compatibilidade)
    return this.categoriesService.getAllCategories(user.id);
  }

  @Get('search')
  search(
    @CurrentUser() user: { id: string },
    @Query('q') query: string,
  ) {
    return this.categoriesService.searchCategories(user.id, query);
  }

  // Rota :id deve vir depois de rotas específicas como 'search'
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.categoriesService.getCategoryById(id, user.id);
  }

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.categoriesService.createCategory(user.id, createCategoryDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.categoriesService.updateCategory(id, user.id, updateCategoryDto);
  }

  @Delete('bulk')
  bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.categoriesService.bulkDeleteCategories(bulkDeleteDto.ids, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.categoriesService.deleteCategory(id, user.id);
  }
}


