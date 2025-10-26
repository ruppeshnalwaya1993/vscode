# Getting Started with RisingBird Development

## Quick Start Guide

This guide will help you set up your development environment and start contributing to RisingBird.

## Prerequisites

### Required Software
- **Node.js**: Version 22.x (recommended: 22.20.0)
- **npm**: Version 10.x or higher
- **Git**: Latest version
- **Python**: 3.x (for node-gyp)
- **Visual Studio Code**: For development (optional but recommended)

### Recommended Tools
- **nvm** (Node Version Manager): For managing Node.js versions
- **VS Code Extensions**:
  - ESLint
  - TypeScript and JavaScript Language Features
  - GitLens

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ruppeshnalwaya1993/vscode.git
cd vscode
git checkout ai-fork/bootstrap
```

### 2. Install Dependencies

We've provided a convenient setup script:

```bash
# Full setup with clean install
./scripts/dev-setup.sh --clean full --run

# Or manual setup
npm ci
npm run compile
```

### 3. Verify Installation

```bash
# Run the development build
npm run electron

# Or use the script
./scripts/code.sh
```

You should see RisingBird launch with the new branding.

## Project Structure

### Key Directories

```
vscode/
├── src/
│   └── vs/
│       └── workbench/
│           └── contrib/
│               ├── risingbird/          # Our AI features (NEW)
│               ├── chat/                # Existing chat infrastructure
│               ├── inlineChat/          # Existing inline chat
│               └── inlineCompletions/   # Existing completions
├── build/                               # Build scripts
├── scripts/                             # Helper scripts
├── extensions/                          # Built-in extensions
└── test/                                # Tests
```

### RisingBird Structure (To Be Created)

```
src/vs/workbench/contrib/risingbird/
├── common/
│   ├── aiService.ts                    # Main AI service
│   ├── modelProvider.ts                # AI provider abstraction
│   ├── configuration.ts                # Settings
│   ├── constants.ts                    # Constants
│   └── types.ts                        # Type definitions
├── browser/
│   ├── risingbird.contribution.ts      # Main contribution file
│   ├── autocomplete/                   # Tab autocomplete
│   ├── chat/                           # Chat interface
│   ├── inlineEdit/                     # Inline editing
│   └── composer/                       # Agent mode
└── test/
    └── ...                             # Tests
```

## Development Workflow

### 1. Create a New Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit files in `src/vs/workbench/contrib/risingbird/`

### 3. Compile

```bash
# Watch mode (auto-recompile on changes)
npm run watch

# Or single compilation
npm run compile
```

### 4. Test Your Changes

```bash
# Run the development build
npm run electron

# Or use the script
./scripts/code.sh
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "your test name"
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

## Building Your First Feature

Let's create a simple "Hello World" contribution to understand the structure.

### Step 1: Create the Service

Create `src/vs/workbench/contrib/risingbird/common/helloService.ts`:

```typescript
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const IHelloService = createDecorator<IHelloService>('helloService');

export interface IHelloService {
    readonly _serviceBrand: undefined;
    sayHello(name: string): string;
}

export class HelloService implements IHelloService {
    readonly _serviceBrand: undefined;

    sayHello(name: string): string {
        return `Hello, ${name}! Welcome to RisingBird.`;
    }
}
```

### Step 2: Register the Service

Create `src/vs/workbench/contrib/risingbird/browser/risingbird.contribution.ts`:

```typescript
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IHelloService, HelloService } from '../common/helloService.js';
import { registerAction2 } from '../../../../platform/actions/common/actions.js';
import { Action2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import * as nls from '../../../../nls.js';

// Register the service
registerSingleton(IHelloService, HelloService, InstantiationType.Delayed);

// Register a command
class SayHelloAction extends Action2 {
    constructor() {
        super({
            id: 'risingbird.sayHello',
            title: nls.localize('sayHello', "Say Hello"),
            f1: true // Show in command palette
        });
    }

    async run(accessor: ServicesAccessor): Promise<void> {
        const helloService = accessor.get(IHelloService);
        const message = helloService.sayHello('Developer');

        // Show notification
        const notificationService = accessor.get(INotificationService);
        notificationService.info(message);
    }
}

registerAction2(SayHelloAction);
```

### Step 3: Register the Contribution

Add to `src/vs/workbench/workbench.common.main.ts`:

```typescript
// Add this line with other imports
import 'vs/workbench/contrib/risingbird/browser/risingbird.contribution';
```

### Step 4: Compile and Test

```bash
npm run compile
npm run electron
```

Press `Cmd+Shift+P` (or `Ctrl+Shift+P`), type "Say Hello", and run the command!

## Common Development Tasks

### Adding a New Configuration Setting

1. Define in `src/vs/workbench/contrib/risingbird/common/configuration.ts`:

```typescript
export const RISINGBIRD_CONFIG = {
    AI_PROVIDER: 'risingbird.ai.provider',
    API_KEY: 'risingbird.ai.apiKey',
    MODEL: 'risingbird.ai.model'
};
```

2. Register in contribution file:

```typescript
import { Registry } from '../../../../platform/registry/common/platform.js';
import { IConfigurationRegistry, Extensions } from '../../../../platform/configuration/common/configurationRegistry.js';

const configurationRegistry = Registry.as<IConfigurationRegistry>(Extensions.Configuration);

configurationRegistry.registerConfiguration({
    id: 'risingbird',
    title: 'RisingBird',
    properties: {
        'risingbird.ai.provider': {
            type: 'string',
            enum: ['openai', 'anthropic', 'gemini'],
            default: 'openai',
            description: 'AI provider to use'
        },
        'risingbird.ai.apiKey': {
            type: 'string',
            default: '',
            description: 'API key for the AI provider'
        }
    }
});
```

### Adding a New View/Panel

1. Create view container:

```typescript
import { ViewContainer, IViewContainersRegistry, Extensions } from '../../../common/views.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';

const VIEW_CONTAINER: ViewContainer = Registry.as<IViewContainersRegistry>(Extensions.ViewContainersRegistry).registerViewContainer({
    id: 'risingbird',
    title: 'RisingBird',
    icon: 'codicon-sparkle',
    order: 5
}, ViewContainerLocation.Sidebar);
```

2. Register view:

```typescript
import { IViewsRegistry, Extensions as ViewExtensions } from '../../../common/views.js';

const viewsRegistry = Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry);

viewsRegistry.registerViews([{
    id: 'risingbird.chat',
    name: 'Chat',
    containerIcon: 'codicon-comment-discussion',
    ctorDescriptor: new SyncDescriptor(RisingBirdChatView),
    canToggleVisibility: true
}], VIEW_CONTAINER);
```

### Adding a Keyboard Shortcut

```typescript
import { KeybindingsRegistry } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';

KeybindingsRegistry.registerCommandAndKeybindingRule({
    id: 'risingbird.openChat',
    weight: KeybindingWeight.WorkbenchContrib,
    when: undefined,
    primary: KeyMod.CtrlCmd | KeyCode.KeyL,
    handler: (accessor) => {
        // Handle command
    }
});
```

## Debugging

### Debug in VS Code

1. Open the project in VS Code
2. Press `F5` or go to Run > Start Debugging
3. Select "VS Code" from the dropdown
4. A new window will open with your changes

### Debug Configuration

The project includes debug configurations in `.vscode/launch.json`:

```json
{
    "type": "extensionHost",
    "request": "launch",
    "name": "Launch Extension",
    "runtimeExecutable": "${execPath}",
    "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
    ]
}
```

### Console Logging

```typescript
import { ILogService } from '../../../../platform/log/common/log.js';

class MyService {
    constructor(
        @ILogService private readonly logService: ILogService
    ) {}

    myMethod() {
        this.logService.info('This is an info message');
        this.logService.error('This is an error message');
        this.logService.debug('This is a debug message');
    }
}
```

### Debugging Tips

1. **Use breakpoints**: Set breakpoints in VS Code
2. **Console logging**: Use `console.log()` or `ILogService`
3. **DevTools**: Open with `Help > Toggle Developer Tools`
4. **Source maps**: Ensure source maps are generated for debugging

## Testing

### Unit Tests

Create test file: `src/vs/workbench/contrib/risingbird/test/common/helloService.test.ts`

```typescript
import * as assert from 'assert';
import { HelloService } from '../../common/helloService.js';

suite('HelloService', () => {
    test('sayHello returns correct message', () => {
        const service = new HelloService();
        const result = service.sayHello('Test');
        assert.strictEqual(result, 'Hello, Test! Welcome to RisingBird.');
    });
});
```

Run tests:

```bash
npm test
```

### Integration Tests

```typescript
import { workbenchInstantiationService } from '../../../../test/browser/workbenchTestServices.js';

suite('Integration Tests', () => {
    test('service integration', async () => {
        const instantiationService = workbenchInstantiationService();
        const helloService = instantiationService.get(IHelloService);

        const result = helloService.sayHello('Integration');
        assert.ok(result.includes('Integration'));
    });
});
```

## Code Style Guidelines

### TypeScript Style

```typescript
// Use interfaces for public APIs
export interface IMyService {
    readonly _serviceBrand: undefined;
    myMethod(param: string): Promise<void>;
}

// Use classes for implementations
export class MyService implements IMyService {
    readonly _serviceBrand: undefined;

    constructor(
        @ILogService private readonly logService: ILogService
    ) {}

    async myMethod(param: string): Promise<void> {
        this.logService.info(`Called with: ${param}`);
    }
}

// Use async/await instead of promises
async function myAsyncFunction(): Promise<string> {
    const result = await someAsyncOperation();
    return result;
}

// Use const for immutable values
const MAX_RETRIES = 3;

// Use descriptive names
function calculateTotalPrice(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}
```

### File Organization

```typescript
// 1. Imports (grouped and sorted)
import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../platform/log/common/log.js';

// 2. Constants
const DEFAULT_TIMEOUT = 5000;

// 3. Interfaces
export interface IMyService {
    // ...
}

// 4. Types
export type MyType = string | number;

// 5. Classes
export class MyService extends Disposable implements IMyService {
    // ...
}

// 6. Functions
export function helperFunction(): void {
    // ...
}
```

### Naming Conventions

- **Interfaces**: `IMyInterface`
- **Classes**: `MyClass`
- **Constants**: `MY_CONSTANT`
- **Private members**: `_privateField`
- **Services**: `myService`
- **Actions**: `MyAction`

## Common Issues & Solutions

### Issue 1: Compilation Errors

**Problem**: TypeScript compilation fails

**Solution**:
```bash
# Clean and rebuild
./scripts/clean-build.sh
npm run compile
```

### Issue 2: Module Not Found

**Problem**: Import errors

**Solution**: Ensure you're using `.js` extensions in imports:
```typescript
// Correct
import { MyClass } from './myModule.js';

// Incorrect
import { MyClass } from './myModule';
```

### Issue 3: Service Not Found

**Problem**: Service injection fails

**Solution**: Ensure service is registered:
```typescript
registerSingleton(IMyService, MyService, InstantiationType.Delayed);
```

### Issue 4: Changes Not Reflected

**Problem**: Code changes don't appear

**Solution**:
```bash
# Restart watch mode
npm run watch

# Or recompile
npm run compile
```

## Next Steps

Now that you're set up, here's what to do next:

1. **Read the Documentation**:
   - [RISINGBIRD_IMPLEMENTATION_PLAN.md](./RISINGBIRD_IMPLEMENTATION_PLAN.md) - Overall plan
   - [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - Technical details
   - [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - Task breakdown

2. **Start with Phase 1**:
   - Set up AI service infrastructure
   - Implement provider abstraction
   - Create configuration system

3. **Join the Community**:
   - GitHub Discussions
   - Discord (to be set up)
   - Weekly meetings

4. **Contribute**:
   - Pick a task from the roadmap
   - Create a branch
   - Implement the feature
   - Submit a pull request

## Resources

### Documentation
- [VSCode Extension API](https://code.visualstudio.com/api)
- [VSCode Source Code](https://github.com/microsoft/vscode)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### AI APIs
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [Google AI Documentation](https://ai.google.dev)

### Tools
- [VSCode Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Actions](https://docs.github.com/en/actions)

## Getting Help

If you run into issues:

1. **Check the documentation** in this repository
2. **Search GitHub Issues** for similar problems
3. **Ask in Discussions** for general questions
4. **Create an Issue** for bugs or feature requests
5. **Join Discord** for real-time help (coming soon)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Submit a pull request

### Code Review

All submissions require review. We use GitHub pull requests for this purpose.

---

**Happy Coding!** 🚀

If you have questions or need help, don't hesitate to reach out!

