# Debugging WhatsApp Webhook Processing Error

## Current Status

✅ **Webhook receiving messages correctly** - Backend logs show statusCode 201 (success)  
❌ **ProcessIncomingMessageCommand failing** - Error during command execution

## Changes Made

### Enhanced Logging in ProcessIncomingMessageHandler

Added comprehensive logging at every step of message processing to identify the exact failure point:

1. **Customer Identification Phase**
   - Log when starting customer identification
   - Log successful customer ID
   - Catch and log any errors with full stack trace

2. **Conversation Loading/Creation Phase**
   - Log when loading conversation
   - Log if creating new conversation vs loading existing
   - Log conversation ID and state when loaded
   - Catch and log any errors with full stack trace

3. **State Machine Processing**
   - Log current conversation state
   - Log which state branch is being executed
   - Log button IDs being processed
   - Log successful completion

## Next Steps

### 1. Restart Backend and Test

```bash
# Stop current backend process (Ctrl+C)
pnpm --filter backend dev
```

### 2. Send Test Message

Send "Hola" to +1 809 798 2896 from WhatsApp

### 3. Check Logs

Look for the detailed logs to identify where the error occurs:

```
[INFO] Starting message processing
  businessId: 93f91bdb-805a-4fa4-8804-c937b6b0c14d
  customerPhone: +18095551234
  messageText: Hola

[INFO] Identifying customer...
[INFO] Customer identified successfully
  customerId: <uuid>

[INFO] Loading conversation...
[INFO] No existing conversation found, creating new one
  OR
[INFO] Loaded existing conversation
  conversationId: <uuid>
  state: INITIAL

[INFO] Processing conversation state
  state: INITIAL

[INFO] State: INITIAL - transitioning to selecting service

[INFO] Message processing completed successfully
```

## Likely Issues to Investigate

Based on the code review, here are the most likely failure points:

### 1. Business Not Found in Database

**Symptom:** Error during customer identification  
**Cause:** DEFAULT_BUSINESS_ID doesn't exist in `businesses` table  
**Solution:** Verify business exists:

```sql
SELECT * FROM businesses WHERE id = '93f91bdb-805a-4fa4-8804-c937b6b0c14d';
```

### 2. WhatsApp Phone Format Issue

**Symptom:** Error during customer identification  
**Cause:** Phone number format doesn't match E.164 validation  
**Solution:** Check WhatsAppPhone value object validation

### 3. Database Constraint Violation

**Symptom:** Error during conversation save  
**Cause:** Missing foreign key (customer_id or business_id)  
**Solution:** Check database constraints and ensure customer was created successfully

### 4. Offering Not Found

**Symptom:** Error when sending service selection buttons  
**Cause:** No active offerings in database for the business  
**Solution:** Verify offerings exist:

```sql
SELECT * FROM offerings WHERE business_id = '93f91bdb-805a-4fa4-8804-c937b6b0c14d' AND is_active = true;
```

## Expected Log Output

### Success Case

```
[INFO] Starting message processing
[INFO] Identifying customer...
[INFO] Customer identified successfully
[INFO] Loading conversation...
[INFO] No existing conversation found, creating new one
[INFO] Processing conversation state
[INFO] State: INITIAL - transitioning to selecting service
[INFO] Message processing completed successfully
```

### Failure Case (Example)

```
[INFO] Starting message processing
[INFO] Identifying customer...
[ERROR] Failed to identify customer
  error: "Business with id 93f91bdb-805a-4fa4-8804-c937b6b0c14d not found"
  stack: <full stack trace>
```

## Files Modified

- `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`
  - Added try-catch blocks with detailed error logging
  - Added info logs at each processing step
  - Added state logging for debugging state machine

## Configuration Verified

✅ `.env` has correct DEFAULT_BUSINESS_ID: `93f91bdb-805a-4fa4-8804-c937b6b0c14d`  
✅ Seed executed successfully with real WhatsApp number  
✅ Business created in database  
✅ Webhook URL configured in Facebook  
✅ Webhook receiving messages (statusCode 201)

## What to Report Back

After restarting the backend and sending a test message, please share:

1. **Full log output** from the backend console
2. **Specific error message** if any (with stack trace)
3. **Which log line was the last one before the error** (this tells us where it failed)

This will help us pinpoint the exact issue and fix it quickly.
