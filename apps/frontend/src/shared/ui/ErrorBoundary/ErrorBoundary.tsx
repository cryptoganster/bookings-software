import { Component, type ReactNode } from "react";
import { Container, Title, Text, Button, Stack } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl">
          <Stack align="center" gap="md">
            <IconAlertTriangle size={64} stroke={1.5} color="red" />
            <Title order={1}>Algo salió mal</Title>
            <Text c="dimmed" ta="center">
              {this.state.error?.message || "Ha ocurrido un error inesperado"}
            </Text>
            <Button onClick={this.handleReload} mt="md">
              Recargar página
            </Button>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
