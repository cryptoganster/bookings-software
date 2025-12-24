import { Modal, Select, TextInput, Button, Group, Stack } from "@mantine/core";
import { useState } from "react";
import { useCreateSchedule } from "@entities/schedule";
import { notifications } from "@mantine/notifications";

interface ScheduleCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
];

export function ScheduleCreateModal({
  opened,
  onClose,
}: ScheduleCreateModalProps) {
  const createSchedule = useCreateSchedule();
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dayOfWeek || !startTime || !endTime) {
      notifications.show({
        title: "Error",
        message: "Todos los campos son requeridos",
        color: "red",
      });
      return;
    }

    try {
      await createSchedule.mutateAsync({
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
      });

      notifications.show({
        title: "Horario creado",
        message: "El horario se ha creado exitosamente",
        color: "green",
      });

      // Reset form
      setDayOfWeek("");
      setStartTime("");
      setEndTime("");
      onClose();
    } catch {
      notifications.show({
        title: "Error",
        message: "No se pudo crear el horario",
        color: "red",
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Crear Horario" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Día de la semana"
            placeholder="Selecciona un día"
            data={DAYS_OF_WEEK}
            required
            value={dayOfWeek}
            onChange={(value) => setDayOfWeek(value || "")}
          />

          <TextInput
            label="Hora de inicio"
            placeholder="09:00"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <TextInput
            label="Hora de fin"
            placeholder="18:00"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={createSchedule.isPending}>
              Crear
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
