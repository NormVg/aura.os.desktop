# Quick Start: Ollama in Aura Desktop

Get up and running with local AI in under 5 minutes.

## Step 1: Install Ollama (2 min)

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from [ollama.com/download](https://ollama.com/download)

## Step 2: Start Ollama (30 sec)

```bash
ollama serve
```

Keep this terminal open. You should see:
```
Ollama is running
```

## Step 3: Pull a Model (1-2 min)

Open a new terminal:

```bash
# Fast, lightweight (recommended for first try)
ollama pull llama3.2:3b

# Or try these:
ollama pull phi3:mini        # Very fast, 2GB
ollama pull mistral:7b       # Higher quality, 4GB
```

Wait for download to complete.

## Step 4: Configure Aura Desktop (1 min)

1. Launch Aura Desktop: `npm run dev`
2. Open Settings (gear icon)
3. Go to **AI** tab
4. In **Models** section:
   - Provider: Select **"Ollama (Local)"**
   - Model ID: Enter **`llama3.2:3b`** (or your pulled model)
   - Display name: Enter **"Llama Local"**
   - Click **+** button
5. In **Model Routing** section:
   - Chat (Conversation): Select **"Llama Local"**
6. Close settings

## Step 5: Test It! (30 sec)

1. Open chat sidebar (if not already open)
2. Type: "Hello! Can you introduce yourself?"
3. Press Enter
4. Watch the response stream in!

## Verify It's Working

You should see:
- ✅ Response appears within 1-2 seconds
- ✅ Text streams smoothly
- ✅ No API key errors
- ✅ Ollama terminal shows activity

## Troubleshooting

### "Connection refused"
```bash
# Make sure Ollama is running:
ollama serve
```

### "Model not found"
```bash
# Pull the model first:
ollama pull llama3.2:3b

# List installed models:
ollama list
```

### Slow responses
```bash
# Try a smaller model:
ollama pull phi3:mini
```

## Next Steps

### Try Tool Calling
1. Add a tool-capable model:
   ```bash
   ollama pull llama3.1:8b
   ```
2. In Settings → AI → Models, add it
3. Assign to "Tool Calling" role
4. Ask: "What's 42 * 17?" (uses calculator tool)

### Mix Providers
Use Ollama for chat, cloud for complex tasks:
- **Chat**: Ollama (fast, private)
- **Tool Calling**: OpenRouter (reliable)
- **Summarization**: Ollama (good enough)

### Voice Mode
1. Configure Sarvam or Edge TTS
2. Click microphone icon
3. Speak your question
4. Aura responds with voice!

## Model Recommendations

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| phi3:mini | 2GB | ⚡⚡⚡ | ⭐⭐ | Quick questions |
| llama3.2:3b | 4GB | ⚡⚡ | ⭐⭐⭐ | General chat |
| mistral:7b | 8GB | ⚡ | ⭐⭐⭐⭐ | Complex tasks |
| llama3.1:8b | 8GB | ⚡ | ⭐⭐⭐⭐ | Tool calling |

## Common Commands

```bash
# List installed models
ollama list

# Remove a model
ollama rm llama3.2:3b

# Update a model
ollama pull llama3.2:3b

# Check Ollama version
ollama --version

# Stop Ollama
# Press Ctrl+C in the terminal running 'ollama serve'
```

## Performance Tips

1. **First response is slow**: Model loading into RAM (normal)
2. **Subsequent responses fast**: Model cached in memory
3. **Out of memory**: Try smaller model or close other apps
4. **Want faster**: Use GPU-enabled Ollama build

## Privacy Benefits

✅ All conversations stay on your machine
✅ No data sent to cloud services
✅ Works offline
✅ No API costs
✅ No rate limits

## Getting Help

- **Ollama Docs**: [ollama.com/docs](https://ollama.com/docs)
- **Model Library**: [ollama.com/library](https://ollama.com/library)
- **Aura Setup**: See `OLLAMA_SETUP.md` for detailed guide

---

**Total Setup Time**: ~5 minutes
**Cost**: $0
**Privacy**: 100% local

Enjoy your private, local AI assistant! 🚀
