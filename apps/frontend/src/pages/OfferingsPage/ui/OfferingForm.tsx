/**
 * OfferingForm Component
 *
 * Reusable form for creating and editing offerings.
 * Uses React Hook Form with Zod validation.
 *
 * Features:
 * - Validation with Zod schema
 * - Error messages below fields
 * - Loading states
 * - Accessibility (ARIA attributes)
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Stack,
  TextInput,
  NumberInput,
  Button,
  Group,
  Loader,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { OfferingDto } from "@packages/shared-types";
import {
  offeringFormSchema,
  defaultOfferingValues,
  type OfferingFormData,
} from "@entities/offering";

/**
 * Props for OfferingForm component
 */
export interface OfferingFormProps {
  /** Offering to edit (null for create mode) */
  offering?: OfferingDto | null;
  /** Submit handler */
  onSubmit: (data: OfferingFormData) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * OfferingForm Component
 *
 * Formulario reutilizable para crear y editar offerings.
 * Modo creación: offering = null
 * Modo edición: offering = OfferingDto
 */
export function OfferingForm({
  offering,
  onSubmit,
  onCancel,
  isLoading = false,
}: OfferingFormProps) {
  // Preparar valores iniciales
  const initialValues: OfferingFormData = offering
    ? {
        name: offering.name,
        durationMinutes: offering.duration,
        maxCapacityPerSlot: offering.maxCapacityPerSlot,
        maxDailyCapacity: offering.maxDailyCapacity,
      }
    : defaultOfferingValues;

  // Responsive behavior
  // Requirements: 8.4, 8.5
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setFocus,
  } = useForm<OfferingFormData>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: initialValues,
    mode: "onBlur", // Validar al perder foco
  });

  // Watch numeric values for NumberInput
  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form's watch is needed for controlled NumberInput
  const durationMinutes = watch("durationMinutes");
  const maxCapacityPerSlot = watch("maxCapacityPerSlot");
  const maxDailyCapacity = watch("maxDailyCapacity");

  // Auto-focus en el primer campo al montar el componente
  // Requirements: 7.2
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  // Handler interno para submit
  const handleFormSubmit = async (data: OfferingFormData) => {
    await onSubmit(data);
  };

  // Handler para tecla Enter en campos numéricos
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleSubmit(handleFormSubmit)();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} onKeyDown={handleKeyDown}>
      <Stack gap="md">
        {/* Campo: Nombre */}
        <TextInput
          label="Nombre del servicio"
          placeholder="Ej: Corte de pelo"
          required
          disabled={isLoading}
          error={errors.name?.message}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />

        {/* Campo: Duración */}
        <NumberInput
          label="Duración (minutos)"
          placeholder="30"
          required
          disabled={isLoading}
          min={15}
          max={480}
          step={15}
          value={durationMinutes}
          onChange={(value) => setValue("durationMinutes", value as number)}
          error={errors.durationMinutes?.message}
          aria-describedby={
            errors.durationMinutes ? "duration-error" : undefined
          }
        />

        {/* Campo: Capacidad por slot */}
        <NumberInput
          label="Capacidad por slot"
          placeholder="1"
          required
          disabled={isLoading}
          min={1}
          max={100}
          value={maxCapacityPerSlot}
          onChange={(value) => setValue("maxCapacityPerSlot", value as number)}
          error={errors.maxCapacityPerSlot?.message}
          aria-describedby={
            errors.maxCapacityPerSlot ? "capacity-error" : undefined
          }
        />

        {/* Campo: Capacidad diaria máxima (opcional) */}
        <NumberInput
          label="Capacidad diaria máxima (opcional)"
          placeholder="Sin límite"
          disabled={isLoading}
          min={1}
          value={maxDailyCapacity ?? undefined}
          onChange={(value) =>
            setValue("maxDailyCapacity", value ? (value as number) : null)
          }
          error={errors.maxDailyCapacity?.message}
          aria-describedby={
            errors.maxDailyCapacity ? "daily-capacity-error" : undefined
          }
        />

        {/* Botones de acción */}
        {/* Requirements: 8.5 - Mobile: apilados full-width, Desktop: en fila ancho automático */}
        <Group
          justify={isMobile ? "stretch" : "flex-end"}
          mt="md"
          gap="sm"
          style={isMobile ? { flexDirection: "column" } : undefined}
        >
          <Button
            variant="subtle"
            onClick={onCancel}
            disabled={isLoading}
            type="button"
            aria-label="Cancelar y cerrar formulario"
            fullWidth={isMobile}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            leftSection={isLoading ? <Loader size="xs" /> : undefined}
            aria-label={isLoading ? "Guardando servicio" : "Guardar servicio"}
            fullWidth={isMobile}
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
