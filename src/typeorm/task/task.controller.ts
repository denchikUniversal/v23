import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { TaskService  } from './task.service';
import { CreateTaskDto } from './dto/createTask.dto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
   findAll() {
    return this.taskService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.taskService.findById(+id);
  }

  @Post()
  create(@Body() task: CreateTaskDto) {
    return this.taskService.create(task);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateTaskDto) {
    return this.taskService.update(+id, dto);
  }

  @Patch(':id')
  patchUpdate(@Param('id') id: string, @Body() dto: Partial<CreateTaskDto>) {
    return this.taskService.patch(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.taskService.delete(+id);
  }
}
