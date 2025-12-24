import { Modal, Select, TextInput, Button, Group, Stack } from "@mantine/core";
import { useState } from "react";
import { useUpdateSchedule } from "@entities/schedule";
import { notifications } from "@mantine/notifications";

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ScheduleEditModalProps {
  opened: boolean;
  onClose: () => void;
  schedule: Schedule | null;
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

export function ScheduleEditModal({
  opened,
  onClose,
  schedule,
}: ScheduleEditModalProps) {
  const updateSchedule = useUpdateSchedule();
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    schedule?.dayOfWeek.toString() || "",
  );
  const [startTime, setStartTime] = useState(schedule?.startTime || "");
  const [endTime, setEndTime] = useState(schedule?.endTime || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schedule || !dayOfWeek || !startTime || !endTime) {
      notifications.show({
        title: "Error",
        message: "Todos los campos son requeridos",
        color: "red",
      });
      return;
    }

    try {
      await updateSchedule.mutateAsync({
        id: schedule.id,
        dto: {
          startTime,
          endTime,
        },
      });

      notifications.show({
        title: "Horario actualizado",
        message: "El horario se ha actualizado exitosamente",
        color: "green",
      });

      onClose();
    } catch {
      notifications.show({
        title: "Error",
        message: "No se pudo actualizar el horario",
        color: "red",
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Editar Horario" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Día de la semana"
            placeholder="Selecciona un día"
            data={DAYS_OF_WEEK}
            required
            value={dayOfWeek}
            onChange={(value) => setDayOfWeek(value || "")}
            disabled
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
            <Button type="submit" loading={updateSchedule.isPending}>
              Guardar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
