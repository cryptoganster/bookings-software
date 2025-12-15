import { useState, useCallback } from "react";

/**
 * Hook para gestionar estado de modals, drawers, etc.
 * Proporciona métodos para abrir, cerrar y toggle
 *
 * @param initialState - Estado inicial (default: false)
 * @returns Objeto con estado y métodos de control
 *
 * @example
 * const { opened, open, close, toggle } = useDisclosure();
 *
 * <Button onClick={open}>Abrir Modal</Button>
 * <Modal opened={opened} onClose={close}>
 *   Contenido del modal
 * </Modal>
 */
export function useDisclosure(initialState: boolean = false) {
  const [opened, setOpened] = useState(initialState);

  const open = useCallback(() => {
    setOpened(true);
  }, []);

  const close = useCallback(() => {
    setOpened(false);
  }, []);

  const toggle = useCallback(() => {
    setOpened((prev) => !prev);
  }, []);

  return {
    opened,
    open,
    close,
    toggle,
  };
}
