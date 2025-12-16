import { LoadingOverlay as MantineLoadingOverlay } from "@mantine/core";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  return (
    <MantineLoadingOverlay
      visible={visible}
      overlayProps={{ blur: 2 }}
      loaderProps={{ children: message }}
    />
  );
}
