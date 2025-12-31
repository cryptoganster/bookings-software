/**
 * LoginForm Component
 *
 * Formulario de login con validación y manejo de errores
 * Diseño profesional con Paper, inputs redondeados y paleta brandGreen
 *
 * Features:
 * - Validación con Zod
 * - Manejo de errores por campo
 * - Loading state durante el login
 * - Integración con TanStack Query
 * - Clears password field after successful submission (SR-1.4)
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Paper,
  Title,
  Text,
  Anchor,
} from "@mantine/core";
import { Link } from "react-router-dom";

import { loginSchema, type LoginFormData } from "../model/schema";
import { useLogin } from "../model/useLogin";

/**
 * Formulario de login
 *
 * Features:
 * - Validación con Zod
 * - Manejo de errores por campo
 * - Loading state durante el login
 * - Integración con TanStack Query
 * - Diseño profesional con Paper (shadow="xl", padding={30}, radius="xl")
 * - Inputs con size="md" y radius="xl"
 * - Botón con color="brandGreen" (paleta verde personalizada)
 * - Clears password field after successful submission (SR-1.4)
 *
 * Requirements:
 * - 2.6: Formulario con Paper profesional
 * - 2.8: Inputs con size="md" y radius="xl"
 * - 2.9: PasswordInput con size="md" y radius="xl"
 * - 2.12: Botón con color="brandGreen"
 * - SR-1.4: Password field memory clearing
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
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        // Clear password field after successful submission (SR-1.4)
        reset({ email: "", password: "" });
      },
    });
  };

  return (
    <Paper
      withBorder
      shadow="xl"
      p={30}
      radius="xl"
      style={{ maxWidth: 420, width: "100%" }}
    >
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
            size="md"
            radius="xl"
            {...register("email")}
            error={errors.email?.message}
            disabled={isPending}
            required
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña"
            size="md"
            radius="xl"
            {...register("password")}
            error={errors.password?.message}
            disabled={isPending}
            required
          />

          <Button
            type="submit"
            fullWidth
            loading={isPending}
            mt="md"
            radius="xl"
            color="brandGreen"
          >
            Iniciar Sesión
          </Button>

          <Text ta="center" size="sm" c="dimmed">
            ¿No tienes cuenta?{" "}
            <Anchor component={Link} to="/register" size="sm">
              Regístrate
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
