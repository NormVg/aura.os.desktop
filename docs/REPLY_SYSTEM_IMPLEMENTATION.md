# Reply System Implementation

## Overview

The reply system in Aura Desktop's chat has been fully implemented, allowing users to reply to specific messages with proper context.

## Features Implemented

### 1. Reply to Any Message

- Click the reply button (↩️) on any AI message
- Message context is shown in the input area
- AI receives context about which message is being replied to

### 2. Smart Suggestions

- After AI responds, a reply chip appears automatically
- Shows a snippet of the last AI message
- Click to quickly reply to the last message

### 3. Visual Feedback

- Reply context bar appears above input when replying
- Shows "Replying to: [message snippet]"
- X button to cancel reply
- Reply chips show below messages area

### 4. Context Preservation

- When replying, AI receives the original message context
- Format: `[Replying to: "original message..."] user's reply`
- Helps AI understand what the user is referring to

## Files Modified

### 1. `src/renderer/src/stores/chat.js`

**Changes:**

- Updated `suggestions` computed property to generate real suggestions from last AI message
- Modified `sendMessage()` to accept `replyToMessageId` parameter
- Added reply context to AI messages when replying
- Updated `addMessage()` to store `replyTo` field
- Added `removeReplyingTo()` function
- Exported `removeReplyingTo` in return statement

**Key Logic:**

```javascript
// Generate suggestion from last AI message
const suggestions = computed(() => {
  if (isStreaming.value || replyingTo.value) return []
  const lastAI = messages.value.filter((m) => m.role === 'ai').at(-1)
  if (!lastAI) return []
  const snippet = lastAI.text.slice(0, 50) + '...'
  return [{ id: lastAI.id, label: snippet, messageId: lastAI.id, fullText: lastAI.text }]
})

// Add reply context to message
if (replyToMessageId) {
  const replyToMsg = messages.value.find((m) => m.id === replyToMessageId)
  if (replyToMsg) {
    lastUserMsg.content = `[Replying to: "${replyToMsg.text.slice(0, 100)}..."]

${lastUserMsg.content}`
  }
}
```

### 2. `src/renderer/src/components/ChatSidebar.vue`

**Changes:**

- Added `chatInputRef` ref to access ChatInput component
- Added `handleReply(msg)` function to handle reply button clicks
- Updated `useSuggestion()` to focus input after setting reply
- Modified `send()` to pass `replyToId` to store
- Updated reply button to use `handleReply(msg)`
- Added `ref="chatInputRef"` to ChatInput component

**Key Logic:**

```javascript
function handleReply(msg) {
  const snippet = msg.text.slice(0, 50) + '...'
  chatStore.setReplyingTo({
    id: msg.id,
    label: snippet,
    messageId: msg.id,
    fullText: msg.text
  })
  if (chatInputRef.value?.focus) {
    chatInputRef.value.focus()
  }
}

async function send(text) {
  const replyToId = replyingTo.value?.messageId || null
  chatStore.clearReplyingTo()
  chatStore.sendMessage(text, replyToId)
  // ...
}
```

### 3. `src/renderer/src/components/ChatInput.vue`

**Changes:**

- Imported `useChatStore` and `storeToRefs`
- Imported `X` icon from lucide-vue-next
- Added `replyingTo` reactive ref from store
- Added reply context bar in template
- Added `removeReply()` function
- Added `focus()` function
- Exposed `focus` method via `defineExpose`

**New UI Elements:**

```vue
<!-- Reply context bar -->
<div v-if="replyingTo" class="ci-reply-bar">
  <div class="ci-reply-content">
    <span class="ci-reply-label">Replying to:</span>
    <span class="ci-reply-text">{{ replyingTo.label }}</span>
  </div>
  <button class="ci-reply-close" @click="removeReply">
    <X :size="12" />
</button>
</div>
```

**New Styles:**

- `.ci-reply-bar` - Container for reply context
- `.ci-reply-content` - Flex container for label and text
- `.ci-reply-label` - "Replying to:" label
- `.ci-reply-text` - Message snippet with ellipsis
- `.ci-reply-close` - X button to cancel reply

### 4. `src/renderer/src/components/ReplyChips.vue`

**Changes:**

- Imported `useChatStore`
- Removed `remove` emit
- Added `removeSuggestion()` function that calls store
- Updated remove button to call `removeSuggestion()`

## User Flow

### Replying to a Message

1. **User clicks reply button** on an AI message
   - `handleReply(msg)` is called
   - Store's `replyingTo` is set with message data
   - Input is focused

2. **Reply context appears** above input
   - Shows "Replying to: [message snippet]"
   - X button to cancel

3. **User types response** and sends
   - `send(text)` extracts `replyToId` from `replyingTo`
   - Calls `chatStore.sendMessage(text, replyToId)`
   - Reply context is cleared

4. **AI receives context**
   - Message includes: `[Replying to: "original message"] user's reply`
   - AI understands what user is referring to

### Using Reply Chips

1. **AI responds** to user
   - Suggestion chip appears automatically
   - Shows snippet of AI's message

2. **User clicks chip**
   - `useSuggestion(s)` is called
   - Sets `replyingTo` with message data
   - Input is focused

3. **User types and sends**
   - Same flow as manual reply

4. **User can remove chip**
   - Click X button on chip
   - Calls `removeSuggestion()`
   - Chip disappears

## Technical Details

### Message Structure

```javascript
{
  id: 1234567890,
  role: 'user' | 'ai',
  text: 'message content',
  toolCalls: [...],
  replyTo: 1234567889  // ID of message being replied to (optional)
}
```

### Reply Context Format

When replying, the AI receives:

```
[Replying to: "Can you explain quantum computing?"]

What are the practical applications?
```

This helps the AI understand:

- What the user is referring to
- Context from previous conversation
- Specific message being addressed

### State Management

```javascript
// Store state
replyingTo: {
  id: 123,              // Unique ID for the chip
  label: 'snippet...',  // Display text
  messageId: 123,       // ID of message being replied to
  fullText: 'full...'   // Complete message text
}

// Suggestions (computed)
suggestions: [
  {
    id: 123,
    label: 'Last AI message snippet...',
    messageId: 123,
    fullText: 'Complete AI message'
  }
]
```

## UI/UX Improvements

### Visual Hierarchy

- Reply context bar has subtle purple tint
- Matches overall Aura color scheme
- Clear visual separation from input

### Interaction Feedback

- Reply button highlights on hover
- X button shows red on hover (destructive action)
- Input auto-focuses when reply is set
- Smooth transitions

### Accessibility

- All buttons have title attributes
- Keyboard navigation supported (Enter to send, Escape could cancel reply)
- Clear visual indicators

## Testing Checklist

- [x] Reply button appears on AI messages
- [x] Clicking reply shows context bar
- [x] Context bar shows correct message snippet
- [x] X button removes reply context
- [x] Sending message includes reply context
- [x] AI receives proper context format
- [x] Reply chips appear after AI response
- [x] Clicking chip sets reply context
- [x] Removing chip clears suggestion
- [x] Input focuses when reply is set
- [x] Build succeeds without errors
- [x] No console errors

## Future Enhancements

Potential improvements for future versions:

1. **Thread View**: Show reply chains visually
2. **Reply Indicators**: Show which messages are replies
3. **Jump to Original**: Click to scroll to original message
4. **Multiple Replies**: Reply to multiple messages at once
5. **Edit Replies**: Edit reply context before sending
6. **Reply Notifications**: Highlight when someone replies to your message
7. **Keyboard Shortcuts**:
   - `R` to reply to last message
   - `Escape` to cancel reply
8. **Reply Preview**: Show full original message on hover

## Known Limitations

1. Reply context is text-only (no tool calls or attachments)
2. Only one reply at a time
3. No visual thread indicators in message list
4. Reply context limited to 100 characters in AI prompt

## Performance Considerations

- Suggestions computed property is efficient (only runs when messages change)
- Reply context is lightweight (just message ID and snippet)
- No additional API calls required
- Minimal memory overhead

---

**Implementation Status**: ✅ Complete and Production Ready
**Build Status**: ✅ Passing
**Testing**: ✅ Manual testing complete
