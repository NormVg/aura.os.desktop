# aura-desktop

An Electron application with Vue and integrated AI capabilities.

## Features

- 🤖 **Multi-Provider AI Support**: OpenRouter, Google AI, and Ollama (local models)
- 🎙️ **Voice-to-Voice**: Speak to Aura and get spoken responses
- 🛠️ **Tool Calling**: AI can execute tools (calculator, weather, URLs, etc.)
- 🎨 **Creative Workspace**: Multiple workspaces with draggable widgets
- 💾 **Persistent State**: All settings and conversations saved locally
- 🔒 **Privacy-First**: Run AI models locally with Ollama

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## AI Setup

See [AI_INTEGRATION.md](./AI_INTEGRATION.md) for detailed AI configuration.

For local AI with Ollama, see [OLLAMA_SETUP.md](./OLLAMA_SETUP.md).
