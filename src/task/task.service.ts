import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/createTask.dto';

@Injectable()
export class TaskService {
  private tasks = [
    {
      id: 1,
      title: 'NestJS',
      description: 'A progressive Node.js framework for building efficient and scalable server-side applications.',
      isCompleted: false,
    }, 
    {
      id: 2,
      title: 'TypeScript',
      description: 'A strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
      isCompleted: false,
    }
  ]

  findAll() {
    return this.tasks;
  }

  findById(id: number) {
    const task = this.tasks.find(task => task.id === id);

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    return task;
  }

  create(task: CreateTaskDto) {
    const { title, description, isCompleted } = task;
    const newTask = {
      id: this.tasks.length + 1,
      title,
      description,
      isCompleted,
    };

    this.tasks.push(newTask);
    return this.tasks;
  }

  update(id: number, dto: CreateTaskDto) {
    const { title, description, isCompleted } = dto;

    const task = this.findById(id);

    task.title = title;
    task.description = description;
    task.isCompleted = isCompleted;

    return task;
  }

  patch(id: number, dto: Partial<CreateTaskDto>) {
    const task = this.findById(id);

    Object.assign(task, dto);

    return task;
  }

  delete(id: number) {
    const task = this.findById(id);

    this.tasks = this.tasks.filter(task => task.id !== id);
    return task;
  }
}
