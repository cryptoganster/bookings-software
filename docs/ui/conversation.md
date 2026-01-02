# Conversations Page

## 1. Overview

### Purpose

The Conversations page allows business owners to manage customer inquiries that require admin attention. When customers select "Consulta al Admin" in the WhatsApp bot, their conversation is flagged as pending and appears in this interface.

### Use Cases

- View all pending customer queries
- Read complete conversation history with a customer
- Respond to customer inquiries via WhatsApp
- Track which conversations have been resolved

### Navigation

**Path:** `/conversations`  
**Menu:** Main navigation sidebar  
**Icon:** Message icon  
**Label:** "Conversaciones"  
**Access:** Business owners only (BUSINESS_OWNER role)

---

## 2. Structure

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Conversaciones                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📱 Juan Pérez                                         │ │
│  │ +1 809 555 1234                                       │ │
│  │ Última actividad: hace 5 minutos                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📱 María García                                       │ │
│  │ +1 809 555 5678                                       │ │
│  │ Última actividad: hace 2 horas                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘


Modal (when conversation is opened):
┌─────────────────────────────────────────────────────────────┐
│  Conversación con Juan Pérez                          [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Juan: Hola, necesito cambiar mi cita             │   │
│  │ 🕐 10:30 AM                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Juan: ¿Pueden ayudarme?                          │   │
│  │ 🕐 10:32 AM                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Escribe tu respuesta...                             │   │
│  │                                                      │   │
│  │                                                      │   │
│  │                                    [Enviar Respuesta]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Behavior

- **Desktop (≥1024px):** Full-width cards with comfortable spacing
- **Tablet (768-1023px):** Slightly narrower cards, modal takes 90% width
- **Mobile (<768px):** Full-width cards, modal takes 100% viewport

---

## 3. Components

### 3.1 PendingQueriesList

**Purpose:** Display all conversations awaiting admin response

**Props:** None (uses React Query hook internally)

**Structure:**

```tsx
<Stack gap="md">
  {conversations.map((conversation) => (
    <ConversationCard
      key={conversation.id}
      conversation={conversation}
      onClick={() => openModal(conversation.id)}
    />
  ))}
</Stack>
```

**States:**

- Loading: Shows skeleton loaders
- Empty: "No hay consultas pendientes" message
- Error: Error alert with retry button
- Success: List of conversation cards

### 3.2 ConversationCard

**Purpose:** Display summary of a pending conversation

**Props:**

- `conversation: ConversationReadModel`
- `onClick: () => void`

**Content:**

- Customer name (bold)
- Customer phone number
- Last activity timestamp (relative time)
- Status badge (always "Pendiente" for this page)

**Interactions:**

- Click anywhere on card → Opens conversation modal
- Hover → Subtle background color change

### 3.3 ConversationModal

**Purpose:** Display full conversation and allow admin to respond

**Props:**

- `conversationId: string | null`
- `onClose: () => void`

**Structure:**

```tsx
<Modal opened={!!conversationId} onClose={onClose} size="lg">
  <Modal.Header>
    <Modal.Title>Conversación con {customerName}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <MessageThread conversationId={conversationId} />
    <ResponseForm conversationId={conversationId} onSuccess={onClose} />
  </Modal.Body>
</Modal>
```

### 3.4 MessageThread

**Purpose:** Display chronological list of messages

**Props:**

- `conversationId: string`

**Structure:**

```tsx
<Stack gap="sm">
  {messages.map((message) => (
    <MessageBubble
      key={message.id}
      message={message}
      align={message.direction === "INBOUND" ? "left" : "right"}
    />
  ))}
</Stack>
```

**Message Types:**

- INBOUND (customer): Left-aligned, gray background
- OUTBOUND (admin): Right-aligned, blue background

**Content per message:**

- Message content (text)
- Timestamp (formatted with date-fns)
- Sender indicator (customer name or "Tú")

### 3.5 ResponseForm

**Purpose:** Allow admin to type and send response

**Props:**

- `conversationId: string`
- `onSuccess: () => void`

**Structure:**

```tsx
<form onSubmit={handleSubmit}>
  <Textarea
    placeholder="Escribe tu respuesta..."
    value={responseText}
    onChange={(e) => setResponseText(e.target.value)}
    minRows={3}
    required
  />
  <Button type="submit" loading={isLoading}>
    Enviar Respuesta
  </Button>
</form>
```

**Validation:**

- Response text is required
- Minimum 1 character
- Maximum 1000 characters (WhatsApp limit)

---

## 4. Actions

### 4.1 Open Conversation

**Trigger:** Click on conversation card

**Flow:**

1. User clicks conversation card
2. `setSelectedConversationId(conversation.id)` updates state
3. Modal opens automatically (controlled by `opened={!!selectedConversationId}`)
4. `useConversationHistory(selectedConversationId)` fetches messages
5. Messages display in chronological order

**Loading State:** Skeleton loaders in modal while messages load

**Error Handling:** Error alert in modal with retry button

### 4.2 Send Response

**Trigger:** Click "Enviar Respuesta" button

**Flow:**

1. User types response in textarea
2. User clicks "Enviar Respuesta"
3. Form validation runs (required, max length)
4. `useSendAdminResponse()` mutation executes
5. Optimistic update: Message appears immediately in thread
6. API call to `POST /api/admin-queries/:id/respond`
7. On success:
   - Success toast notification
   - Modal closes
   - Pending queries list refreshes (conversation removed)
8. On error:
   - Error toast notification
   - Optimistic update reverted
   - User can retry

**Validation:**

- Response text required
- Max 1000 characters

**Optimistic Update:**

```typescript
onMutate: async ({ conversationId, content }) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries(['conversation-history', conversationId]);

  // Snapshot previous value
  const previous = queryClient.getQueryData(['conversation-history', conversationId]);

  // Optimistically update
  queryClient.setQueryData(['conversation-history', conversationId], (old) => [
    ...old,
    {
      id: 'temp-' + Date.now(),
      conversationId,
      direction: 'OUTBOUND',
      content,
      messageType: 'TEXT',
      sentAt: new Date(),
      isFromAdmin: true,
    }
  ]);

  return { previous };
},
onError: (err, variables, context) => {
  // Revert on error
  queryClient.setQueryData(
    ['conversation-history', variables.conversationId],
    context.previous
  );
}
```

---

## 5. API Integration

### Endpoints

| Method | Endpoint                          | Purpose                   |
| ------ | --------------------------------- | ------------------------- |
| GET    | `/api/admin-queries/pending`      | Get pending conversations |
| GET    | `/api/admin-queries/:id/messages` | Get conversation messages |
| POST   | `/api/admin-queries/:id/respond`  | Send admin response       |

### Request/Response Types

**ConversationReadModel:**

```typescript
{
  id: string;
  businessId: string;
  customerId: string;
  customerName: string; // Denormalized
  customerPhone: string; // Denormalized
  status: "ACTIVE" | "AWAITING_ADMIN" | "RESOLVED";
  state: string; // State machine state
  lastMessageAt: Date;
}
```

**MessageReadModel:**

```typescript
{
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  messageType: "TEXT" | "BUTTON" | "LOCATION";
  sentAt: Date;
  isFromAdmin: boolean;
}
```

**SendAdminResponseDto:**

```typescript
{
  content: string; // Required, max 1000 chars
}
```

### React Query Hooks

**useConversations():**

```typescript
const { data, isLoading, isError, error } = useConversations();
// Returns: ConversationReadModel[]
// Query key: ['conversations', 'pending']
// Refetch interval: 30 seconds (polling for new queries)
```

**useConversationHistory(conversationId):**

```typescript
const { data, isLoading, isError } = useConversationHistory(conversationId);
// Returns: MessageReadModel[]
// Query key: ['conversation-history', conversationId]
// Enabled: Only when conversationId is not null
```

**useSendAdminResponse():**

```typescript
const { mutate, isLoading } = useSendAdminResponse();
mutate({ conversationId, content });
// Invalidates: ['conversations', 'pending']
// Invalidates: ['conversation-history', conversationId]
```

---

## 6. State Management

### Local State (useState)

```typescript
const [selectedConversationId, setSelectedConversationId] = useState<
  string | null
>(null);
const [responseText, setResponseText] = useState("");
```

**selectedConversationId:**

- Controls modal open/close
- Passed to `useConversationHistory()` hook
- Set to `null` when modal closes

**responseText:**

- Controlled input for textarea
- Reset to empty string after successful send
- Validated before submission

### Server State (React Query)

**Queries:**

- `['conversations', 'pending']` - List of pending conversations
- `['conversation-history', conversationId]` - Messages for specific conversation

**Mutations:**

- `sendAdminResponse` - Send response and invalidate queries

**Cache Behavior:**

- Pending conversations: Refetch every 30 seconds (polling)
- Conversation history: Cached until invalidated
- Optimistic updates for send response

---

## 7. Forms & Validation

### Response Form

**Fields:**

- `content` (Textarea) - Required, max 1000 characters

**Validation Rules:**

```typescript
const schema = z.object({
  content: z
    .string()
    .min(1, "La respuesta no puede estar vacía")
    .max(1000, "La respuesta no puede exceder 1000 caracteres"),
});
```

**Validation Timing:**

- On submit (form validation)
- Real-time character count display

**Error Display:**

- Inline error message below textarea
- Character count indicator (e.g., "250/1000")

---

## 8. Notifications

### Success Notifications

**Send Response Success:**

```typescript
notifications.show({
  title: 'Respuesta enviada',
  message: 'Tu respuesta ha sido enviada al cliente vía WhatsApp',
  color: 'green',
  icon: <IconCheck />,
});
```

### Error Notifications

**Send Response Error:**

```typescript
notifications.show({
  title: 'Error al enviar respuesta',
  message: error.message || 'No se pudo enviar la respuesta. Intenta de nuevo.',
  color: 'red',
  icon: <IconX />,
});
```

**Load Conversations Error:**

```typescript
<Alert color="red" title="Error al cargar conversaciones">
  {error.message}
  <Button onClick={() => refetch()}>Reintentar</Button>
</Alert>
```

---

## 9. Permissions

### Role Requirements

- **Required Role:** `BUSINESS_OWNER`
- **Forbidden Roles:** `CUSTOMER`, `ADMIN` (different permissions)

### Access Control

```typescript
// In ProtectedRoute component
if (!user.roles.includes('BUSINESS_OWNER')) {
  return <Navigate to="/unauthorized" />;
}
```

### Data Filtering

- Conversations filtered by `businessId` (from JWT token)
- Users only see conversations for their own business
- Multi-tenant isolation enforced at API level

---

## 10. Navigation

### Entry Points

1. **Main Navigation:** Click "Conversaciones" in sidebar
2. **Dashboard Widget:** Click "Ver todas" in pending queries widget
3. **Direct URL:** Navigate to `/conversations`

### Exit Points

1. **Close Modal:** Click X or outside modal → Returns to list
2. **After Send:** Success → Modal closes → Returns to list
3. **Sidebar Navigation:** Click other menu item → Navigate away

### Breadcrumbs

Not applicable (top-level page)

---

## 11. Loading States

### Initial Load

```tsx
{
  isLoading && (
    <Stack gap="md">
      <Skeleton height={100} />
      <Skeleton height={100} />
      <Skeleton height={100} />
    </Stack>
  );
}
```

### Modal Load

```tsx
{
  isLoadingMessages && (
    <Stack gap="sm">
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </Stack>
  );
}
```

### Send Response

```tsx
<Button type="submit" loading={isSending}>
  {isSending ? "Enviando..." : "Enviar Respuesta"}
</Button>
```

---

## 12. Empty States

### No Pending Conversations

```tsx
<EmptyState
  icon={<IconMessageCircle size={48} />}
  title="No hay consultas pendientes"
  description="Cuando los clientes soliciten ayuda, aparecerán aquí"
/>
```

### No Messages (Edge Case)

```tsx
<EmptyState
  icon={<IconMessage size={48} />}
  title="No hay mensajes"
  description="Esta conversación no tiene mensajes aún"
/>
```

---

## 13. Error States

### Load Conversations Error

```tsx
<Alert color="red" title="Error al cargar conversaciones">
  <Text>{error.message}</Text>
  <Button onClick={() => refetch()} mt="sm">
    Reintentar
  </Button>
</Alert>
```

### Load Messages Error

```tsx
<Alert color="red" title="Error al cargar mensajes">
  <Text>{error.message}</Text>
  <Button onClick={() => refetch()} mt="sm">
    Reintentar
  </Button>
</Alert>
```

### Send Response Error

- Error toast notification (see section 8)
- Form remains editable
- User can retry submission

---

## 14. Accessibility

### Keyboard Navigation

- **Tab:** Navigate between conversation cards
- **Enter/Space:** Open selected conversation
- **Esc:** Close modal
- **Tab in modal:** Navigate between messages and form
- **Enter in textarea:** Submit form (with Ctrl/Cmd)

### Screen Reader Support

```tsx
<Card
  role="button"
  tabIndex={0}
  aria-label={`Conversación con ${conversation.customerName}, última actividad ${formatDistanceToNow(conversation.lastMessageAt)}`}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

### ARIA Labels

- Conversation cards: `aria-label` with customer name and last activity
- Modal: `aria-labelledby` for title
- Form: `aria-describedby` for validation errors
- Buttons: Descriptive labels (not just icons)

### Focus Management

- Modal opens → Focus moves to modal title
- Modal closes → Focus returns to trigger card
- Form submit → Focus remains on form (error) or modal closes (success)

---

## 15. Performance

### Optimization Strategies

1. **React Query Caching:**
   - Conversations cached for 30 seconds
   - Messages cached until invalidated
   - Stale-while-revalidate pattern

2. **Polling:**
   - Pending conversations refetch every 30 seconds
   - Only when page is visible (refetchInterval with focus detection)

3. **Optimistic Updates:**
   - Messages appear immediately when sent
   - Reverted on error

4. **Lazy Loading:**
   - Messages only loaded when modal opens
   - `enabled: !!conversationId` in useQuery

5. **Memoization:**
   - Message list memoized with `useMemo`
   - Callbacks memoized with `useCallback`

### Bundle Size

- Mantine components: Tree-shaken
- date-fns: Only import used functions
- React Query: Included in shared bundle

---

## 16. Testing

### Unit Tests

**ConversationCard.test.tsx:**

```typescript
describe('ConversationCard', () => {
  it('should display customer name and phone', () => {
    render(<ConversationCard conversation={mockConversation} onClick={jest.fn()} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('+1 809 555 1234')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<ConversationCard conversation={mockConversation} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

**ResponseForm.test.tsx:**

```typescript
describe('ResponseForm', () => {
  it('should validate required field', async () => {
    render(<ResponseForm conversationId="123" onSuccess={jest.fn()} />);
    fireEvent.click(screen.getByText('Enviar Respuesta'));
    await waitFor(() => {
      expect(screen.getByText('La respuesta no puede estar vacía')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const onSuccess = jest.fn();
    render(<ResponseForm conversationId="123" onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Escribe tu respuesta...'), {
      target: { value: 'Hola, ¿en qué puedo ayudarte?' }
    });
    fireEvent.click(screen.getByText('Enviar Respuesta'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests

**ConversationsPage.integration.test.tsx:**

```typescript
describe('ConversationsPage Integration', () => {
  it('should load and display pending conversations', async () => {
    server.use(
      rest.get('/api/admin-queries/pending', (req, res, ctx) => {
        return res(ctx.json(mockConversations));
      })
    );

    render(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  it('should open modal and load messages', async () => {
    server.use(
      rest.get('/api/admin-queries/:id/messages', (req, res, ctx) => {
        return res(ctx.json(mockMessages));
      })
    );

    render(<ConversationsPage />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Juan Pérez'));
    });

    await waitFor(() => {
      expect(screen.getByText('Conversación con Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('Hola, necesito cambiar mi cita')).toBeInTheDocument();
    });
  });

  it('should send response and close modal', async () => {
    server.use(
      rest.post('/api/admin-queries/:id/respond', (req, res, ctx) => {
        return res(ctx.status(200));
      })
    );

    render(<ConversationsPage />);

    // Open modal
    await waitFor(() => {
      fireEvent.click(screen.getByText('Juan Pérez'));
    });

    // Type response
    fireEvent.change(screen.getByPlaceholderText('Escribe tu respuesta...'), {
      target: { value: 'Claro, ¿qué día prefieres?' }
    });

    // Submit
    fireEvent.click(screen.getByText('Enviar Respuesta'));

    // Verify modal closes and success notification
    await waitFor(() => {
      expect(screen.queryByText('Conversación con Juan Pérez')).not.toBeInTheDocument();
      expect(screen.getByText('Respuesta enviada')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

**conversations.e2e.test.ts:**

```typescript
describe("Conversations E2E", () => {
  it("should complete full conversation flow", async () => {
    // Login as business owner
    await page.goto("/login");
    await page.fill('[name="email"]', "owner@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to conversations
    await page.click("text=Conversaciones");
    await page.waitForURL("/conversations");

    // Verify pending conversations loaded
    await expect(page.locator("text=Juan Pérez")).toBeVisible();

    // Open conversation
    await page.click("text=Juan Pérez");
    await expect(
      page.locator("text=Conversación con Juan Pérez"),
    ).toBeVisible();

    // Verify messages loaded
    await expect(
      page.locator("text=Hola, necesito cambiar mi cita"),
    ).toBeVisible();

    // Type and send response
    await page.fill(
      'textarea[placeholder="Escribe tu respuesta..."]',
      "Claro, ¿qué día prefieres?",
    );
    await page.click('button:has-text("Enviar Respuesta")');

    // Verify success
    await expect(page.locator("text=Respuesta enviada")).toBeVisible();
    await expect(
      page.locator("text=Conversación con Juan Pérez"),
    ).not.toBeVisible();
  });
});
```

---

## 17. Related Documentation

- **Feature Docs:** `docs/features/conversation.md`
- **API Docs:** `docs/api/conversation.md`
- **Backend Implementation:**
  - `apps/backend/src/conversation/domain/aggregates/conversation.ts`
  - `apps/backend/src/conversation/presentation/controllers/admin-query.controller.ts`
- **Frontend Implementation:**
  - `apps/frontend/src/pages/ConversationsPage/ui/ConversationsPage.tsx`
  - `apps/frontend/src/entities/conversation/model/useConversations.ts`
  - `apps/frontend/src/shared/api/services/conversation.service.ts`

---

## 18. Future Enhancements

1. **Real-time Updates:** WebSocket connection for instant message delivery
2. **Typing Indicators:** Show when customer is typing
3. **Read Receipts:** Show when customer has read admin response
4. **Message Templates:** Quick responses for common queries
5. **Conversation Search:** Search by customer name or message content
6. **Conversation Filters:** Filter by date, status, customer
7. **Bulk Actions:** Mark multiple conversations as resolved
8. **Conversation Notes:** Internal notes visible only to admins
9. **Conversation Assignment:** Assign conversations to specific team members
10. **Rich Media:** Support for images, files, voice messages

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Implemented
