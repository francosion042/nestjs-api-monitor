// Example controller that demonstrates error handling with API Monitor

import { Controller, Get, Post, Body, Param, NotFoundException, InternalServerErrorException } from '@nestjs/common';

// A simple data model
interface User {
  id: number;
  name: string;
  email: string;
}

@Controller('users')
export class UserController {
  // Mock database of users
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  // Get all users - works fine
  @Get()
  findAll(): User[] {
    return this.users;
  }

  // Get a specific user - will throw 404 if user not found
  @Get(':id')
  findOne(@Param('id') id: string): User {
    const userId = Number(id);
    const user = this.users.find(user => user.id === userId);
    
    if (!user) {
      // This will trigger the API Monitor for 404 errors
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  // Create a new user - will throw 500 if email already exists
  @Post()
  create(@Body() userData: Omit<User, 'id'>): User {
    const emailExists = this.users.some(user => user.email === userData.email);
    
    if (emailExists) {
      // This will trigger the API Monitor for 500 errors
      throw new InternalServerErrorException(
        `User with email ${userData.email} already exists`
      );
    }
    
    const newUser = {
      id: this.users.length + 1,
      ...userData,
    };
    
    this.users.push(newUser);
    return newUser;
  }

  // Force a server error for demonstration
  @Get('test-error')
  testError(): void {
    // This will trigger the API Monitor for 500 errors
    throw new InternalServerErrorException(
      'This is a test error to demonstrate API Monitor'
    );
  }
}

// In your AppModule:
/*
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ApiMonitorModule, ApiMonitorMiddleware } from 'nestjs-api-monitor';
import { UserController } from './user.controller';

@Module({
  imports: [
    ApiMonitorModule.forRoot({
      global: false, // We'll use middleware consumer instead
      errorMonitoring: {
        statusCodes: [404, 500], // Monitor 404 and 500 errors
        includeStackTrace: true,
        includeRequestBody: true,
        includeResponseBody: true,
      },
      notifications: {
        // Your notification settings...
      },
    }),
  ],
  controllers: [UserController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the middleware specifically to the UserController
    consumer
      .apply(ApiMonitorMiddleware)
      .forRoutes(UserController);
  }
}
*/ 