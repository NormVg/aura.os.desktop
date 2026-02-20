# Context System - User Guide

## What is the Context System?

The context system lets you show Aura which previous messages to consider when answering your next question. Think of it as highlighting specific parts of the conversation for Aura to focus on.

## How to Use It

### Adding Messages to Context

1. **Find the message** you want Aura to consider
2. **Click the reply button** (↩️) next to the message
3. **The button highlights** to show it's in context
4. **A chip appears** below the chat showing the message

```
Before:
┌─────────────────────────────────────┐
│ AI: "Python is great for ML..."     │
│ [📋] [↩️]  ← Click here             │
└─────────────────────────────────────┘

After:
┌─────────────────────────────────────┐
│ AI: "Python is great for ML..."     │
│ [📋] [↩️]  ← Now highlighted        │
└─────────────────────────────────────┘

Context tray appears:
┌─────────────────────────────────────┐
│ [context Python is great... ✕]      │
└─────────────────────────────────────┘
```

### Adding Multiple Messages

You can add as many messages as you want:

```
Click reply on Message 1:
[context Message 1... ✕]

Click reply on Message 2:
[context Message 1... ✕] [context Message 2... ✕]

Click reply on Message 3:
[context Message 1... ✕] [context Message 2... ✕] [context Message 3... ✕]
```

### Removing Messages from Context

**Option 1: Click X on the chip**

```
[context Message... ✕]  ← Click the X
```

**Option 2: Click reply button again**

```
Click the highlighted reply button to remove from context
```

### Sending Your Question

1. **Add messages to context** (chips appear)
2. **Type your question** in the input box
3. **Press Enter** to send
4. **Aura receives** all context messages + your question
5. **Context automatically clears** after Aura responds

## Examples

### Example 1: Comparing Two Things

```
Conversation:
AI: "React is component-based..."
AI: "Vue is progressive..."

You want to compare them:
1. Click reply on React message
2. Click reply on Vue message
3. Type: "Which should I use for my project?"

Aura sees:
- React explanation
- Vue explanation
- Your question

Aura responds with comparison
Context clears automatically
```

### Example 2: Following Up on Specific Point

```
Long conversation about many topics...

You want to ask about one specific thing:
1. Scroll up to that message
2. Click reply on it
3. Type: "Can you explain this in more detail?"

Aura sees:
- That specific message
- Your question

Aura responds with details
Context clears
```

### Example 3: Multi-Step Instructions

```
AI: "Step 1: Install Node.js"
AI: "Step 2: Run npm install"
AI: "Step 3: Start the server"

You're stuck:
1. Click reply on all 3 steps
2. Type: "I'm getting an error at step 2"

Aura sees:
- All 3 steps
- Your error message

Aura helps debug
Context clears
```

## Visual Guide

### Reply Button States

```
Normal (not in context):
[↩️]  Gray, not highlighted

Active (in context):
[↩️]  Purple highlight

Hover:
[↩️]  Brighter color
```

### Context Chips

```
Format:
[context Message snippet... ✕]
  ↑        ↑                ↑
  Label    Preview         Remove

Multiple chips:
[context A ✕] [context B ✕] [context C ✕]
```

### No Context

```
When no messages in context:
- No chips shown
- Reply buttons normal (not highlighted)
- Clean interface
```

## Tips & Tricks

### 1. Add Context Before Asking

```
✅ Good:
1. Add relevant messages to context
2. Ask your question
3. Get focused answer

❌ Not as good:
1. Ask vague question
2. Aura guesses what you mean
```

### 2. Remove Irrelevant Context

```
Added too many messages?
Click X on chips you don't need
Keep only relevant ones
```

### 3. Toggle Context

```
Changed your mind?
Click reply button again
Message removed from context
```

### 4. Context Clears Automatically

```
After Aura responds:
- Context automatically clears
- Chips disappear
- Start fresh for next question
```

## Common Questions

### Q: Why use context?

A: Helps Aura understand exactly what you're referring to, especially in long conversations.

### Q: How many messages can I add?

A: As many as you want, but keep it relevant. Too much context can be overwhelming.

### Q: Do I always need to add context?

A: No! Aura remembers the full conversation. Use context when you want to highlight specific messages.

### Q: What happens to context after I send?

A: It automatically clears after Aura responds, so you start fresh.

### Q: Can I add my own messages to context?

A: Currently only AI messages. You can add multiple AI messages though.

### Q: Can I edit context?

A: You can add/remove messages, but not edit the message text itself.

## Troubleshooting

### Chips not appearing

- ✅ Make sure you clicked the reply button
- ✅ Look below the messages area
- ✅ Check if you're in the right chat

### Reply button not highlighting

- ✅ Click directly on the button
- ✅ Wait a moment for the highlight
- ✅ Try clicking again

### Context not clearing

- ✅ Wait for Aura to finish responding
- ✅ Context clears automatically after response
- ✅ You can manually remove chips with X

### Too many chips

- ✅ Click X on chips you don't need
- ✅ Or click reply buttons to toggle off
- ✅ Keep only relevant context

## Best Practices

### 1. Be Selective

```
❌ Don't add every message
✅ Add only relevant ones
```

### 2. Use for Comparisons

```
✅ Add multiple options
✅ Ask "which is better?"
✅ Get focused comparison
```

### 3. Use for Clarifications

```
✅ Add the confusing message
✅ Ask for clarification
✅ Get specific explanation
```

### 4. Use for Follow-ups

```
✅ Add the original message
✅ Ask follow-up question
✅ Get contextual answer
```

## Keyboard Shortcuts (Future)

Coming soon:

- `Ctrl/Cmd + Click` - Add to context
- `Escape` - Clear all context
- `Ctrl/Cmd + R` - Reply to last message

## Advanced Usage

### Threading Conversations

```
1. Add Message A to context
2. Ask question about A
3. Aura responds
4. Add Message B to context
5. Ask question about B
6. Keep conversations organized
```

### Building Context Gradually

```
1. Add Message 1
2. Add Message 2
3. Review chips
4. Remove if needed
5. Add Message 3
6. Ask comprehensive question
```

### Context for Complex Questions

```
For complex questions:
1. Add all relevant background
2. Add specific examples
3. Add any constraints
4. Ask your question
5. Get comprehensive answer
```

---

**Pro Tip**: The context system is most useful when you want Aura to focus on specific parts of a long conversation. For simple follow-ups, you might not need it at all!

**Remember**: Context automatically clears after each response, so you always start fresh. This prevents confusion and keeps conversations clean.
