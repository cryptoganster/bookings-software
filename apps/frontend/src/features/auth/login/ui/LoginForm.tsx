/**
 * LoginForm Component
 * 
 * Formulario de login con validación y manejo de errores
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, PasswordInput, Button, Stack, Paper, Title, Text } from '@mantine/core';

import { loginSchema, type LoginFormData } from '../model/schema';
import { useLogin } from '../model/useLogin';

/**
 * Formulario de login
 * 
 * Features:
 * - Validación con Zod
 * - Manejo de errores por campo
 * - Loading state durante el login
 * - Integración con TanStack Query
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <Paper withBorder shadow="md" p={30} radius="md" style={{ maxWidth: 420, margin: '0 auto' }}>
      <Title order={2} ta="center" mb="md">
        Iniciar Sesión
      </Title>
      
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Ingresa tus credenciales para acceder al panel
      </Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="tu@email.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={isPending}
            required
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña"
            {...register('password')}
            error={errors.password?.message}
            disabled={isPending}
            required
          />

          <Button 
            type="submit" 
            fullWidth 
            loading={isPending}
            mt="md"
          >
            Iniciar Sesión
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
