# 🚀 RisingBird - AI-Powered Code Editor

<div align="center">

![RisingBird Logo](https://img.shields.io/badge/RisingBird-AI%20Editor-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![VSCode Fork](https://img.shields.io/badge/Based%20on-VSCode-007ACC?style=for-the-badge&logo=visual-studio-code)](https://github.com/microsoft/vscode)
[![Status](https://img.shields.io/badge/Status-Planning-orange?style=for-the-badge)](https://github.com/ruppeshnalwaya1993/vscode)

**An open-source AI-powered code editor built on VSCode, designed to compete with Cursor**

[Features](#-features) • [Documentation](#-documentation) • [Getting Started](#-getting-started) • [Roadmap](#-roadmap) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

RisingBird is a **fork of Visual Studio Code** that integrates powerful AI capabilities directly into the editor's core.

### 🔑 Key Point: Native Integration, NOT Extensions

**We are NOT building extensions.** Like Cursor, we're modifying VSCode's core to build AI features natively. This is the **only way** to achieve:
- Deep AST (Abstract Syntax Tree) access
- Rendering pipeline modifications
- Shadow workspace capabilities
- True real-time performance
- Seamless native UI

Extensions have fundamental limitations that make Cursor-like features impossible. See [HOW_CURSOR_WAS_BUILT.md](./HOW_CURSOR_WAS_BUILT.md) for detailed technical explanation.

### Why RisingBird?

- **🔓 Open Source**: Fully transparent, community-driven development
- **🎯 Native Integration**: Built into the editor core, not as extensions
- **🔀 Multiple AI Providers**: OpenAI, Anthropic, Google, and custom endpoints
- **🔒 Privacy First**: Local-only mode available, you control your data
- **⚡ High Performance**: Optimized for speed with <300ms autocomplete latency
- **🎨 Familiar Interface**: Built on VSCode, so you already know how to use it

## ✨ Features

### Core Features (MVP)

#### 🤖 Tab Autocomplete
AI-powered code completion with multi-line suggestions
- Context-aware predictions
- Multi-line ghost text
- <300ms latency
- Smart caching

#### 💬 Chat Interface (Cmd+L)
Conversational AI assistant for coding
- Natural language code generation
- Code explanation and documentation
- Slash commands (`/edit`, `/fix`, `/explain`, `/test`, etc.)
- Apply code directly to files
- Persistent chat sessions

#### ✏️ Inline Editing (Cmd+K)
Quick inline AI edits with natural language
- Fast inline widget
- Multiple suggestion variants
- Streaming responses
- Accept/reject with keyboard shortcuts

#### 🧠 Codebase Understanding
Semantic search and intelligent code navigation
- Automatic workspace indexing
- Answer questions about your codebase
- Smart context selection
- Incremental updates

### Advanced Features

#### 🎼 Composer/Agent Mode
AI agent for complex multi-file tasks
- Natural language task understanding
- Multi-step planning and execution
- File creation/modification/deletion
- Terminal command execution
- Preview changes before applying
- Rollback support

#### 🔌 Multiple AI Models
Support for various AI providers
- **OpenAI**: GPT-3.5, GPT-4, GPT-4-turbo
- **Anthropic**: Claude 2, Claude 3 (Opus, Sonnet, Haiku)
- **Google**: Gemini Pro
- **Custom**: Your own API endpoints

#### 🔐 Privacy Mode
Complete control over your data
- Local-only processing option
- Sensitive data detection
- Configurable exclude patterns
- Transparent data usage

#### 🖥️ Terminal Integration
AI-powered terminal assistance
- Command suggestions
- Error explanation and fixes
- Natural language to commands
- Output analysis

#### 🔀 Git Integration
AI-assisted version control
- Auto-generated commit messages
- Code review assistance
- PR description generation
- Merge conflict resolution

#### ✨ Smart Rewrites
Automatic code improvements
- Style consistency
- Best practice suggestions
- Performance optimizations
- Security checks

## 📚 Documentation

We've created comprehensive documentation to help you understand and contribute to RisingBird:

| Document | Description | Audience |
|----------|-------------|----------|
| **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | High-level overview and quick reference | Everyone |
| **[HOW_CURSOR_WAS_BUILT.md](./HOW_CURSOR_WAS_BUILT.md)** | ⭐ Why native, not extensions | **READ THIS FIRST** |
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | Setup guide and first contribution | Developers |
| **[RISINGBIRD_IMPLEMENTATION_PLAN.md](./RISINGBIRD_IMPLEMENTATION_PLAN.md)** | Comprehensive implementation plan | Technical Leads |
| **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** | Detailed technical specifications | Developers |
| **[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)** | 16-week task breakdown | Project Managers |
| **[CURSOR_FEATURES_ANALYSIS.md](./CURSOR_FEATURES_ANALYSIS.md)** | Feature comparison and strategy | Product Managers |

### Quick Links

- **For Developers**: Start with [GETTING_STARTED.md](./GETTING_STARTED.md)
- **For Contributors**: Read [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
- **For Architects**: Study [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
- **For PMs**: Review [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v22.x (recommended: 22.20.0)
- **npm**: v10.x or higher
- **Git**: Latest version
- **Python**: 3.x (for node-gyp)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/ruppeshnalwaya1993/vscode.git
cd vscode
git checkout ai-fork/bootstrap

# Run the setup script (handles everything)
./scripts/dev-setup.sh --clean full --run

# Or manual setup
npm ci
npm run compile
npm run electron
```

### First Contribution

```bash
# Create a feature branch
git checkout -b feature/your-feature

# Make your changes in src/vs/workbench/contrib/risingbird/

# Compile and test
npm run watch  # In one terminal
npm run electron  # In another terminal

# Run tests
npm test

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed instructions.

## 🗺️ Roadmap

### Phase 1: Foundation (Weeks 1-2) ⏳
- [ ] AI service layer
- [ ] Provider abstraction
- [ ] Context builder
- [ ] Configuration system

### Phase 2: Autocomplete (Weeks 3-4) 📋
- [ ] Completion provider
- [ ] Multi-line support
- [ ] Context awareness
- [ ] Caching

### Phase 3: Chat (Weeks 5-6) 📋
- [ ] Chat interface
- [ ] Slash commands
- [ ] Code application
- [ ] Session management

### Phase 4: Inline Edit (Week 7) 📋
- [ ] Quick edit widget
- [ ] Keyboard shortcuts
- [ ] Streaming suggestions

### Phase 5: Composer (Weeks 8-9) 📋
- [ ] Agent orchestrator
- [ ] Multi-file operations
- [ ] Change preview
- [ ] Shadow workspace

### Phase 6: Advanced (Weeks 10-12) 📋
- [ ] Terminal integration
- [ ] Git integration
- [ ] Code review AI

### Phase 7: Polish (Weeks 13-14) 📋
- [ ] UI/UX refinement
- [ ] Documentation
- [ ] Performance optimization

### Phase 8: Launch (Weeks 15-16) 📋
- [ ] Testing
- [ ] Bug fixes
- [ ] Public release

See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for detailed task breakdown.

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         RisingBird Features             │
├─────────────────────────────────────────┤
│  Autocomplete │ Chat │ Inline │ Composer│
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         AI Service Layer                │
├─────────────────────────────────────────┤
│  Provider │ Context │ Cache │ Embedding │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      AI Provider Abstraction            │
├─────────────────────────────────────────┤
│  OpenAI │ Anthropic │ Gemini │ Custom  │
└─────────────────────────────────────────┘
```

### Project Structure

```
src/vs/workbench/contrib/risingbird/
├── common/
│   ├── aiService.ts              # Main AI orchestration
│   ├── modelProvider.ts          # Provider abstraction
│   ├── configuration.ts          # Settings
│   └── indexing/                 # Codebase indexing
├── browser/
│   ├── risingbird.contribution.ts # Main registration
│   ├── autocomplete/             # Tab completion
│   ├── chat/                     # Chat interface
│   ├── inlineEdit/               # Inline editing
│   └── composer/                 # Agent mode
└── test/
    └── ...                       # Tests
```

See [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) for detailed specifications.

## 🤝 Contributing

We welcome contributions from everyone! Here's how you can help:

### Ways to Contribute

- **💻 Code**: Implement features, fix bugs, improve performance
- **🎨 Design**: UI/UX improvements, icons, themes
- **📝 Documentation**: Improve docs, write tutorials, create examples
- **🧪 Testing**: Test features, report bugs, write test cases
- **💡 Ideas**: Suggest features, provide feedback, share use cases

### Contribution Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Test** thoroughly
5. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the existing code style
- Keep commits atomic and well-described

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📊 Current Status

**Status**: 🟡 Planning Complete, Development Starting
**Version**: 0.1.0-alpha
**Last Updated**: October 26, 2025

### What's Done ✅

- [x] Project setup and branding
- [x] Comprehensive planning documents
- [x] Technical architecture design
- [x] Development roadmap
- [x] Feature analysis
- [x] Getting started guide

### What's Next 🎯

- [ ] Begin Phase 1 implementation
- [ ] Set up CI/CD pipeline
- [ ] Create initial prototypes
- [ ] Build community
- [ ] Start documentation site

## 🎯 Success Metrics

### Technical Targets
- ⚡ Autocomplete latency: <300ms
- 💬 Chat response: <2s first token
- 📈 Acceptance rate: >30%
- 💾 Memory overhead: <200MB
- ⏱️ Indexing: <5s per 1000 files

### User Targets
- 👥 1,000+ downloads in first month
- ⭐ >4.5/5 user satisfaction
- 🔄 >70% retention rate
- 📊 >10 chat messages per user per day

## 🆚 Comparison

### RisingBird vs Cursor

| Feature | RisingBird | Cursor |
|---------|------------|--------|
| Open Source | ✅ Yes | ❌ No |
| Multiple AI Providers | ✅ Yes | ⚠️ Limited |
| Privacy Mode | ✅ Yes | ⚠️ Partial |
| Customizable | ✅ Highly | ⚠️ Limited |
| Native Integration | ✅ Yes | ✅ Yes |
| Tab Autocomplete | 🔄 Planned | ✅ Yes |
| Chat Interface | 🔄 Planned | ✅ Yes |
| Composer Mode | 🔄 Planned | ✅ Yes |
| Cost | 💰 Free/Low | 💰 Higher |

### RisingBird vs GitHub Copilot

| Feature | RisingBird | Copilot |
|---------|------------|---------|
| Chat Interface | 🔄 Planned | ✅ Yes |
| Multi-file Agent | 🔄 Planned | ❌ No |
| Codebase Search | 🔄 Planned | ⚠️ Limited |
| Multiple Models | ✅ Yes | ❌ No |
| Open Source | ✅ Yes | ❌ No |
| Privacy Mode | ✅ Yes | ❌ No |

## 🔒 Privacy & Security

RisingBird takes your privacy seriously:

- **🏠 Local-Only Mode**: Process everything locally, nothing sent to cloud
- **🔐 Secure Storage**: API keys encrypted in system keychain
- **🚫 No Telemetry**: Optional, transparent telemetry only
- **👁️ Transparent**: Open source, you can see exactly what we do
- **⚙️ Configurable**: Fine-grained control over what gets sent where
- **🛡️ Safe by Default**: Sensitive data detection and warnings

## 💰 Pricing & Sustainability

RisingBird is **free and open source** (MIT License).

### Cost Structure

- **Editor**: Free forever
- **AI APIs**: Bring your own API keys
- **Hosting**: Self-hosted or use our cloud (coming soon)
- **Enterprise**: Custom solutions available (future)

### Sustainability

- Open source contributions
- Sponsorships and donations
- Enterprise support contracts
- Cloud hosting services (optional)

## 🌟 Community

Join our growing community:

- **GitHub**: [Issues](https://github.com/ruppeshnalwaya1993/vscode/issues) • [Discussions](https://github.com/ruppeshnalwaya1993/vscode/discussions)
- **Discord**: Coming soon
- **Twitter**: Coming soon
- **Blog**: Coming soon

## 📜 License

RisingBird is licensed under the [MIT License](./LICENSE.txt).

This means you can:
- ✅ Use it commercially
- ✅ Modify it
- ✅ Distribute it
- ✅ Use it privately

## 🙏 Acknowledgments

RisingBird is built on the shoulders of giants:

- **Microsoft VSCode**: The foundation of this project
- **Cursor**: Inspiration for AI features
- **OpenAI, Anthropic, Google**: AI providers
- **Open Source Community**: Contributors and supporters

## 📞 Contact

- **Issues**: [GitHub Issues](https://github.com/ruppeshnalwaya1993/vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ruppeshnalwaya1993/vscode/discussions)
- **Email**: Coming soon
- **Discord**: Coming soon

## 🚀 Let's Build Together!

RisingBird is more than just a code editor—it's a community-driven project to democratize AI-powered coding. Whether you're a developer, designer, writer, or user, there's a place for you here.

**Ready to contribute?** Check out [GETTING_STARTED.md](./GETTING_STARTED.md)!

**Have questions?** Open a [Discussion](https://github.com/ruppeshnalwaya1993/vscode/discussions)!

**Found a bug?** Report it in [Issues](https://github.com/ruppeshnalwaya1993/vscode/issues)!

---

<div align="center">

**Made with ❤️ by the RisingBird community**

[⭐ Star us on GitHub](https://github.com/ruppeshnalwaya1993/vscode) • [🐦 Follow us on Twitter](#) • [💬 Join our Discord](#)

</div>

