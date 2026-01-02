import { render, screen } from "@/test/test-utils";
import { userEvent } from "@testing-library/user-event";
import { ConversationList } from "../ConversationList";
import type { ConversationReadModel } from "@packages/shared-types";

const mockConversations: ConversationReadModel[] = [
  {
    id: "1",
    businessId: "business-1",
    customerId: "customer-1",
    customerName: "Juan Pérez",
    customerPhone: "+18095551234",
    status: "AWAITING_ADMIN",
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    businessId: "business-1",
    customerId: "customer-2",
    customerName: "María García",
    customerPhone: "+18095555678",
    status: "ACTIVE",
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

describe("ConversationList", () => {
  it("should render list of conversations", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("María García")).toBeInTheDocument();
  });

  it("should show empty state when no conversations", () => {
    render(<ConversationList conversations={[]} onSelect={() => {}} />);

    expect(
      screen.getByText("No hay conversaciones pendientes"),
    ).toBeInTheDocument();
  });

  it("should call onSelect when conversation is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ConversationList
        conversations={mockConversations}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText("Juan Pérez"));

    expect(onSelect).toHaveBeenCalledWith(mockConversations[0]);
  });

  it("should highlight selected conversation", () => {
    const { container } = render(
      <ConversationList
        conversations={mockConversations}
        selectedId="1"
        onSelect={() => {}}
      />,
    );

    const selectedPaper = container.querySelector(
      '[style*="background-color"]',
    );
    expect(selectedPaper).toBeInTheDocument();
  });

  it("should show correct status badges", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
  });
});
