# Ollama UI Changes

## Settings → AI Tab

### Before

```
API Keys
├── OpenRouter
├── Google
└── Sarvam AI (Voice)

Models
└── [Add Model Form]
    ├── Provider: [OpenRouter ▼] [Google ▼]
    └── ...
```

### After

```
API Keys
├── OpenRouter
├── Google
├── Ollama Base URL ← NEW!
└── Sarvam AI (Voice)

Models
└── [Add Model Form]
    ├── Provider: [OpenRouter ▼] [Google ▼] [Ollama (Local) ▼] ← NEW!
    └── ...
```

## New Field Details

### Ollama Base URL

- **Type**: Text input (not password)
- **Default**: `http://localhost:11434/api`
- **Purpose**: Configure where Ollama is running
- **When to change**:
  - Running Ollama on different port
  - Using remote Ollama server
  - Using Ollama behind proxy

### Provider Dropdown

- **New Option**: "Ollama (Local)"
- **Behavior**: Same as other providers
- **Model ID Examples**:
  - `llama3.2:3b`
  - `phi3:mini`
  - `mistral:7b`
  - `qwen2.5:7b`

## Usage Example

1. **Add Ollama Model**:

   ```
   Provider: Ollama (Local)
   Model ID: llama3.2:3b
   Display name: Llama 3.2 Local
   ```

2. **Assign to Role**:

   ```
   Model Routing
   ├── Chat (Conversation): Llama 3.2 Local
   ├── Tool Calling: [Your OpenRouter model]
   └── Summarization: Llama 3.2 Local
   ```

3. **Result**: Chat uses local Ollama, tools use cloud API

## Visual Flow

```
User Types Message
       ↓
Chat Store (sendMessage)
       ↓
IPC → Main Process
       ↓
AI Service (handleChat)
       ↓
resolveModel('chat')
       ↓
createProvider(modelEntry, keys)
       ↓
if provider === 'ollama':
  createOllama({ baseURL })
       ↓
ollama(modelId) ← Calls local Ollama
       ↓
Stream response back to UI
```

## Configuration Storage

Settings are persisted in:

```
~/Library/Application Support/aura-desktop/aura-state.json
```

Example saved state:

```json
{
  "settings": {
    "ai": {
      "keys": {
        "openrouter": "sk-...",
        "google": "",
        "sarvam": "...",
        "ollamaBaseURL": "http://localhost:11434/api"
      },
      "models": [
        {
          "id": "llama-local-1234567890",
          "provider": "ollama",
          "modelId": "llama3.2:3b",
          "label": "Llama 3.2 Local"
        }
      ],
      "roles": {
        "chat": "llama-local-1234567890"
      }
    }
  }
}
```

## Error Handling

### Connection Failed

If Ollama is not running, user sees:

```
⚠️ Error: fetch failed
```

**Solution**: Start Ollama with `ollama serve`

### Model Not Found

If model isn't pulled:

```
⚠️ Error: model 'llama3.2:3b' not found
```

**Solution**: Pull model with `ollama pull llama3.2:3b`

### Invalid Base URL

If URL is malformed:

```
⚠️ Error: Invalid URL
```

**Solution**: Use format `http://host:port/api`

## Testing Checklist

- [x] Ollama provider appears in dropdown
- [x] Base URL field saves correctly
- [x] Can add Ollama model
- [x] Model appears in role assignment
- [x] Chat works with Ollama model
- [x] Settings persist after restart
- [x] Build succeeds without errors
- [x] No console errors in dev mode

---

All UI changes are backward compatible. Existing configurations will continue to work without modification.
