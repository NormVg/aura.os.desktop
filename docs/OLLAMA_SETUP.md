# Ollama Setup Guide for Aura Desktop

Ollama support has been added to Aura Desktop, allowing you to run AI models locally on your machine.

## Prerequisites

1. **Install Ollama** on your system:
   - Visit [ollama.com](https://ollama.com) to download
   - Or use Homebrew on macOS: `brew install ollama`

2. **Start Ollama service**:

   ```bash
   ollama serve
   ```

   This starts the Ollama API server on `http://localhost:11434`

3. **Pull a model** (examples):

   ```bash
   # Lightweight models
   ollama pull llama3.2:3b
   ollama pull phi3:mini
   ollama pull qwen2.5:3b

   # Medium models
   ollama pull llama3.2:7b
   ollama pull mistral:7b

   # Larger models (requires more RAM)
   ollama pull llama3.1:8b
   ollama pull qwen2.5:14b
   ```

## Configuration in Aura Desktop

1. **Open Settings** → **AI** tab

2. **Configure Ollama Base URL** (optional):
   - Default: `http://localhost:11434/api`
   - Change only if running Ollama on a different host/port

3. **Add an Ollama Model**:
   - Provider: Select "Ollama (Local)"
   - Model ID: Enter the model name (e.g., `llama3.2:3b`, `phi3:mini`)
   - Display name: Give it a friendly name (e.g., "Llama 3.2 3B")
   - Click the **+** button

4. **Assign to a Role**:
   - In "Model Routing" section, assign your Ollama model to:
     - Chat (Conversation)
     - Tool Calling
     - Summarization

## Recommended Models

### For Chat

- **llama3.2:3b** - Fast, good quality, low memory (~2GB)
- **phi3:mini** - Very fast, compact (~2GB)
- **mistral:7b** - Higher quality, needs more RAM (~4GB)

### For Tool Calling

- **llama3.1:8b** - Excellent tool calling support
- **qwen2.5:7b** - Good at structured outputs
- **mistral:7b** - Reliable tool execution

### For Summarization

- **llama3.2:3b** - Fast and concise
- **phi3:mini** - Quick summaries

## Benefits of Ollama

✅ **Privacy** - All processing happens locally, no data sent to cloud
✅ **No API costs** - Free to use, no rate limits
✅ **Offline capable** - Works without internet connection
✅ **Fast** - Low latency for local models
✅ **Customizable** - Fine-tune models for your needs

## Troubleshooting

### "Connection refused" error

- Make sure Ollama is running: `ollama serve`
- Check the base URL in settings matches your Ollama server

### Model not found

- Pull the model first: `ollama pull <model-name>`
- Verify model name matches exactly (case-sensitive)

### Slow responses

- Try a smaller model (3B parameters instead of 7B+)
- Check system resources (RAM, CPU usage)
- Consider using GPU acceleration if available

### Tool calling not working

- Use models with good tool support (llama3.1, qwen2.5)
- Some smaller models may not support tools reliably

## Mixing Providers

You can use different providers for different tasks:

- **Ollama** for general chat (fast, private)
- **OpenRouter/Google** for complex reasoning or tool calling
- **Edge TTS** for voice (free, no API key needed)

This gives you the best of both worlds: privacy + power when needed.

## Model Management

List installed models:

```bash
ollama list
```

Remove a model:

```bash
ollama rm <model-name>
```

Update a model:

```bash
ollama pull <model-name>
```

## Performance Tips

1. **RAM Requirements**:
   - 3B models: ~4GB RAM
   - 7B models: ~8GB RAM
   - 13B+ models: 16GB+ RAM

2. **Speed Optimization**:
   - Close other applications
   - Use quantized models (Q4, Q5 variants)
   - Enable GPU acceleration if available

3. **Quality vs Speed**:
   - Smaller models (3B) = faster but less capable
   - Larger models (7B+) = slower but better quality
   - Test different models to find your sweet spot

---

**Note**: Ollama models run entirely on your machine. First-time responses may be slower as the model loads into memory, but subsequent responses will be faster.
