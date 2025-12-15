# Ejemplos de Uso - API Contract Layer

## 📚 Tabla de Contenidos

1. [Backend: Implementar el Contrato](#backend-implementar-el-contrato)
2. [Frontend: Consumir el Contrato](#frontend-consumir-el-contrato)
3. [Flujo Completo: Login](#flujo-completo-login)
4. [Flujo Completo: Crear Appointment](#flujo-completo-crear-appointment)

---

## Backend: Implementar el Contrato

### 1. Mapper: Domain → DTO

```typescript
// apps/backend/src/auth/presentation/mappers/user.mapper.ts
import { UserDto } from '@bookings/shared-types';
import { UserReadModel } from '../../domain/read-models/user';

export class UserMapper {
  /**
   * Convierte un Read Model del dominio a un DTO de API
   */
  static toDto(user: UserReadModel): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      businessId: user.businessId,
      createdAt: user.createdAt.toISOString(), // Date → ISO string
    };
  }
  
  /**
   * Convierte múltiples Read Models a DTOs
   */
  static toDtoList(users: UserReadModel[]): UserDto[] {
    return users.map(this.toDto);
  }
}
```

### 2. Controller: Usar DTOs en Endpoints

```typescript
// apps/backend/src/auth/presentation/controllers/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { 
  LoginRequestDto, 
  LoginResponseDto,
  RegisterRequestDto,
  UserDto 
} from '@bookings/shared-types';
import { UserMapper } from '../mappers/user.mapper';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  
  /**
   * POST /auth/login
   * Request: LoginRequestDto
   * Response: LoginResponseDto
   */
  @Post('login')
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    // 1. Ejecutar comando de dominio
    const result = await this.commandBus.execute(
      new LoginCommand(dto.email, dto.password)
    );
    
    // 2. Mapear resultado a DTO
    return {
      user: UserMapper.toDto(result.user),
      token: result.token
    };
  }
  
  /**
   * POST /auth/register
   * Request: RegisterRequestDto
   * Response: LoginResponseDto
   */
  @Post('register')
  async register(@Body() dto: RegisterRequestDto): Promise<LoginResponseDto> {
    const result = await this.commandBus.execute(
      new RegisterCommand(dto.email, dto.password, dto.name)
    );
    
    return {
      user: UserMapper.toDto(result.user),
      token: result.token
    };
  }
  
  /**
   * GET /auth/me
   * Response: UserDto
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() userId: string): Promise<UserDto> {
    const user = await this.queryBus.execute(
      new GetUserQuery(userId)
    );
    
    return UserMapper.toDto(user);
  }
}
```

### 3. Validación: DTOs con class-validator

```typescript
// apps/backend/src/auth/presentation/dtos/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { LoginRequestDto } from '@bookings/shared-types';

/**
 * DTO interno del backend con validaciones
 * Implementa el contrato LoginRequestDto
 */
export class LoginDto implements LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
```

---

## Frontend: Consumir el Contrato

### 1. API Client: Usar DTOs

```typescript
// apps/frontend/src/shared/api/auth.api.ts
import { 
  LoginRequestDto, 
  LoginResponseDto,
  RegisterRequestDto,
  UserDto 
} from '@bookings/shared-types';
import { apiClient } from './client';

export const authApi = {
  /**
   * POST /auth/login
   */
  login: async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    const response = await apiClient.post<LoginResponseDto>(
      '/auth/login',
      credentials
    );
    return response.data;
  },
  
  /**
   * POST /auth/register
   */
  register: async (data: RegisterRequestDto): Promise<LoginResponseDto> => {
    const response = await apiClient.post<LoginResponseDto>(
      '/auth/register',
      data
    );
    return response.data;
  },
  
  /**
   * GET /auth/me
   */
  getMe: async (): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>('/auth/me');
    return response.data;
  }
};
```

### 2. React Hook: Usar DTOs con TanStack Query

```typescript
// apps/frontend/src/features/auth/login/model/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { LoginRequestDto, LoginResponseDto } from '@bookings/shared-types';
import { authApi } from '@shared/api/auth.api';
import { useAuthStore } from '@app/store/auth.store';

export function useLogin() {
  return useMutation<LoginResponseDto, Error, LoginRequestDto>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // data.user es tipado como UserDto
      // data.token es tipado como string
      useAuthStore.getState().login(data.user, data.token);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    }
  });
}
```

### 3. React Component: Usar el Hook

```typescript
// apps/frontend/src/features/auth/login/ui/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoginRequestDto } from '@bookings/shared-types';
import { useLogin } from '../model/useLogin';

// Schema de validación del frontend
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres')
});

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequestDto>({
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit = (data: LoginRequestDto) => {
    login(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="email"
        placeholder="Email"
        {...register('email')}
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input
        type="password"
        placeholder="Password"
        {...register('password')}
      />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Flujo Completo: Login

### 1. Usuario hace click en "Login"

```typescript
// Frontend: LoginForm.tsx
const onSubmit = (data: LoginRequestDto) => {
  login(data); // { email: 'user@example.com', password: 'password123' }
};
```

### 2. Frontend envía request

```typescript
// Frontend: auth.api.ts
const response = await apiClient.post<LoginResponseDto>(
  '/auth/login',
  { email: 'user@example.com', password: 'password123' }
);
```

### 3. Backend recibe y valida

```typescript
// Backend: auth.controller.ts
@Post('login')
async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
  // class-validator valida automáticamente
  // Si falla, retorna 400 Bad Request
```

### 4. Backend ejecuta lógica de dominio

```typescript
// Backend: LoginHandler
const user = await this.userRepository.findByEmail(dto.email);
const isValid = await bcrypt.compare(dto.password, user.password);
if (!isValid) throw new UnauthorizedException();
```

### 5. Backend mapea y responde

```typescript
// Backend: auth.controller.ts
return {
  user: UserMapper.toDto(user), // Domain → DTO
  token: this.jwtService.sign({ userId: user.id })
};
```

### 6. Frontend recibe y actualiza estado

```typescript
// Frontend: useLogin.ts
onSuccess: (data: LoginResponseDto) => {
  // data.user: UserDto
  // data.token: string
  useAuthStore.getState().login(data.user, data.token);
  navigate('/dashboard');
}
```

---

## Flujo Completo: Crear Appointment

### Backend

```typescript
// 1. Mapper
export class AppointmentMapper {
  static toDto(appointment: AppointmentReadModel): AppointmentDto {
    return {
      id: appointment.id,
      businessId: appointment.businessId,
      customerId: appointment.customerId,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      offeringId: appointment.offeringId,
      offeringName: appointment.offeringName,
      dateTime: appointment.dateTime.toISOString(),
      status: appointment.status,
      createdAt: appointment.createdAt.toISOString(),
      cancelledAt: appointment.cancelledAt?.toISOString() ?? null
    };
  }
}

// 2. Controller
@Controller('appointments')
export class AppointmentController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateAppointmentRequestDto,
    @CurrentUser() userId: string
  ): Promise<CreateAppointmentResponseDto> {
    const result = await this.commandBus.execute(
      new CreateAppointmentCommand(
        userId,
        dto.customerId,
        dto.offeringId,
        new Date(dto.dateTime) // ISO string → Date
      )
    );
    
    return { appointmentId: result.appointmentId };
  }
  
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() filters: AppointmentFiltersDto,
    @CurrentUser() userId: string
  ): Promise<AppointmentDto[]> {
    const appointments = await this.queryBus.execute(
      new GetAppointmentsQuery(userId, filters)
    );
    
    return appointments.map(AppointmentMapper.toDto);
  }
}
```

### Frontend

```typescript
// 1. API
export const appointmentsApi = {
  create: async (
    data: CreateAppointmentRequestDto
  ): Promise<CreateAppointmentResponseDto> => {
    const response = await apiClient.post<CreateAppointmentResponseDto>(
      '/appointments',
      data
    );
    return response.data;
  },
  
  getAll: async (
    filters?: AppointmentFiltersDto
  ): Promise<AppointmentDto[]> => {
    const response = await apiClient.get<AppointmentDto[]>(
      '/appointments',
      { params: filters }
    );
    return response.data;
  }
};

// 2. Hooks
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation<
    CreateAppointmentResponseDto,
    Error,
    CreateAppointmentRequestDto
  >({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      // Invalidar queries para refetch
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
}

export function useAppointments(filters?: AppointmentFiltersDto) {
  return useQuery<AppointmentDto[], Error>({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentsApi.getAll(filters)
  });
}

// 3. Component
export function CreateAppointmentForm() {
  const { mutate: createAppointment } = useCreateAppointment();
  
  const onSubmit = (data: CreateAppointmentRequestDto) => {
    createAppointment(data, {
      onSuccess: (response) => {
        console.log('Created:', response.appointmentId);
      }
    });
  };
  
  // ... form UI
}
```

---

## 🎯 Ventajas Demostradas

1. **Type Safety End-to-End**: TypeScript valida en compilación
2. **Contrato Explícito**: Ambos lados conocen la estructura
3. **Sin Acoplamiento**: Backend y Frontend independientes
4. **Fácil Testing**: Mock del contrato, no del backend completo
5. **Documentación Viva**: Los tipos SON la documentación
