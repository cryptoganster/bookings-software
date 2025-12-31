/**
 * RegisterForm Component
 *
 * Registration form with validation and password strength indicator
 *
 * Features:
 * - Form with email, password, confirmPassword, name, acceptTerms fields
 * - Integration with Zod schema via React Hook Form
 * - Password strength indicator integration
 * - Loading state during submission
 * - Link to login page
 * - Clears password fields after successful submission
 *
 * Requirements: FR-1.1, FR-1.2, FR-1.3, FR-1.6, SR-1.4
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
  Checkbox,
  Anchor,
  Box,
} from "@mantine/core";
import { Link } from "react-router-dom";

import { registerSchema, type RegisterFormData } from "../model/schema";
import { useRegister } from "../model/useRegister";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

/**
 * Registration form component
 *
 * @example
 * ```tsx
 * <RegisterForm />
 * ```
 */
export function RegisterForm() {
  const { mutate: register, isPending } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      acceptTerms: false,
    },
  });

  // Watch password for strength indicator
  const watchedPassword = watch("password");

  const onSubmit = (data: RegisterFormData) => {
    // Extract only the fields needed for API
    const { email, password, name } = data;

    register(
      { email, password, name },
      {
        onSuccess: () => {
          // Clear password fields after successful submission (SR-1.4)
          reset({
            email: "",
            password: "",
            confirmPassword: "",
            name: "",
            acceptTerms: false,
          });
        },
      },
    );
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
        Crear Cuenta
      </Title>

      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Regístrate para comenzar a gestionar tus reservas
      </Text>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Nombre"
            placeholder="Tu nombre completo"
            size="md"
            radius="xl"
            {...registerField("name")}
            error={errors.name?.message}
            disabled={isPending}
          />

          <TextInput
            label="Email"
            placeholder="tu@email.com"
            size="md"
            radius="xl"
            {...registerField("email")}
            error={errors.email?.message}
            disabled={isPending}
          />

          <Box>
            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              size="md"
              radius="xl"
              {...registerField("password")}
              error={errors.password?.message}
              disabled={isPending}
            />
            {/* Password strength indicator */}
            {watchedPassword && (
              <Box mt="xs">
                <PasswordStrengthIndicator password={watchedPassword} />
              </Box>
            )}
          </Box>

          <PasswordInput
            label="Confirmar Contraseña"
            placeholder="Repite tu contraseña"
            size="md"
            radius="xl"
            {...registerField("confirmPassword")}
            error={errors.confirmPassword?.message}
            disabled={isPending}
          />

          <Checkbox
            label={
              <Text size="sm">
                Acepto los{" "}
                <Anchor component={Link} to="/terms" size="sm">
                  términos y condiciones
                </Anchor>
              </Text>
            }
            {...registerField("acceptTerms")}
            error={errors.acceptTerms?.message}
            disabled={isPending}
          />

          <Button
            type="submit"
            fullWidth
            loading={isPending}
            mt="md"
            radius="xl"
            color="brandGreen"
          >
            Crear Cuenta
          </Button>

          <Text ta="center" size="sm" c="dimmed">
            ¿Ya tienes cuenta?{" "}
            <Anchor component={Link} to="/login" size="sm">
              Inicia sesión
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
