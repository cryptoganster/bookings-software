import { render, screen, waitFor } from "@/test/test-utils";
import { userEvent } from "@testing-library/user-event";
import { AdminResponseForm } from "../AdminResponseForm";

describe("AdminResponseForm", () => {
  it("should render form with textarea and button", () => {
    render(<AdminResponseForm onSubmit={async () => {}} />);

    expect(
      screen.getByPlaceholderText("Escribe tu respuesta al cliente..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar/i })).toBeInTheDocument();
  });

  it("should disable button when message is empty", () => {
    render(<AdminResponseForm onSubmit={async () => {}} />);

    const button = screen.getByRole("button", { name: /enviar/i });
    expect(button).toBeDisabled();
  });

  it("should enable button when message has content", async () => {
    render(<AdminResponseForm onSubmit={async () => {}} />);

    const textarea = screen.getByPlaceholderText(
      "Escribe tu respuesta al cliente...",
    );
    await userEvent.type(textarea, "Hola, ¿en qué puedo ayudarte?");

    const button = screen.getByRole("button", { name: /enviar/i });
    expect(button).not.toBeDisabled();
  });

  it("should call onSubmit with message when form is submitted", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AdminResponseForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(
      "Escribe tu respuesta al cliente...",
    );
    await userEvent.type(textarea, "Test message");

    const button = screen.getByRole("button", { name: /enviar/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Test message");
    });
  });

  it("should clear message after successful submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AdminResponseForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(
      "Escribe tu respuesta al cliente...",
    ) as HTMLTextAreaElement;
    await userEvent.type(textarea, "Test message");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(textarea.value).toBe("");
    });
  });

  it("should show error when submit fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<AdminResponseForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(
      "Escribe tu respuesta al cliente...",
    );
    await userEvent.type(textarea, "Test message");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should show loading state during submit", async () => {
    const onSubmit = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    render(<AdminResponseForm onSubmit={onSubmit} isLoading />);

    const textarea = screen.getByPlaceholderText(
      "Escribe tu respuesta al cliente...",
    );
    expect(textarea).toBeDisabled();
  });
});
