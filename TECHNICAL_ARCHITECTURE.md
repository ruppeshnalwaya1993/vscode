# RisingBird Technical Architecture

## Overview

This document provides detailed technical specifications for implementing Cursor-like features in RisingBird, a VSCode fork. The architecture is designed to be modular, performant, and maintainable.

## Core Principles

1. **Native Integration**: All features built into VSCode core, not as extensions
2. **Performance First**: Minimal impact on editor performance
3. **Privacy by Design**: Local-first with optional cloud features
4. **Extensibility**: Easy to add new AI providers and features
5. **Reliability**: Graceful degradation when AI services are unavailable

## System Architecture

### Layer 1: AI Provider Abstraction

#### Interface: `IAIProvider`

```typescript
interface IAIProvider {
    readonly id: string;
    readonly name: string;
    readonly models: string[];

    // Completion API
    complete(request: CompletionRequest): Promise<CompletionResponse>;

    // Streaming API
    streamComplete(request: CompletionRequest): AsyncIterable<CompletionChunk>;

    // Chat API
    chat(messages: ChatMessage[]): Promise<ChatResponse>;

    // Streaming Chat API
    streamChat(messages: ChatMessage[]): AsyncIterable<ChatChunk>;

    // Embeddings API
    generateEmbedding(text: string): Promise<number[]>;
}

interface CompletionRequest {
    prompt: string;
    context?: string;
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
    model?: string;
}

interface CompletionResponse {
    text: string;
    finishReason: 'stop' | 'length' | 'error';
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}

interface ChatResponse {
    message: ChatMessage;
    finishReason: 'stop' | 'length' | 'error';
    usage: TokenUsage;
}
```

#### Implementations

1. **OpenAIProvider** - GPT-3.5, GPT-4, GPT-4-turbo
2. **AnthropicProvider** - Claude 2, Claude 3
3. **GeminiProvider** - Gemini Pro
4. **LocalProvider** - Local models via ONNX/llama.cpp
5. **CustomProvider** - User-defined API endpoints

### Layer 2: Core Services

#### 1. AI Service (`IAIService`)

Main orchestration service that manages AI requests.

```typescript
interface IAIService {
    // Provider management
    registerProvider(provider: IAIProvider): void;
    getProvider(id: string): IAIProvider | undefined;
    setActiveProvider(id: string): void;

    // High-level APIs
    complete(options: CompletionOptions): Promise<string>;
    streamComplete(options: CompletionOptions): AsyncIterable<string>;
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

    // Context-aware APIs
    completeInEditor(editor: ICodeEditor, options?: CompletionOptions): Promise<string>;
    chatWithContext(message: string, context: CodeContext): Promise<ChatResponse>;
}

interface CompletionOptions {
    prompt?: string;
    context?: CodeContext;
    maxTokens?: number;
    temperature?: number;
    model?: string;
    provider?: string;
}

interface CodeContext {
    currentFile?: {
        path: string;
        content: string;
        language: string;
    };
    selection?: {
        text: string;
        startLine: number;
        endLine: number;
    };
    openFiles?: Array<{
        path: string;
        content: string;
    }>;
    recentFiles?: string[];
    workspaceInfo?: {
        rootPath: string;
        files: string[];
    };
}
```

#### 2. Context Builder Service (`IContextBuilderService`)

Gathers relevant context for AI requests.

```typescript
interface IContextBuilderService {
    // Build context from editor
    buildEditorContext(editor: ICodeEditor): Promise<CodeContext>;

    // Build context from workspace
    buildWorkspaceContext(options?: ContextOptions): Promise<WorkspaceContext>;

    // Build context for specific file
    buildFileContext(uri: URI): Promise<FileContext>;

    // Smart context selection
    selectRelevantFiles(query: string, maxFiles: number): Promise<URI[]>;
}

interface ContextOptions {
    includeOpenFiles?: boolean;
    includeRecentFiles?: boolean;
    maxFiles?: number;
    maxTokens?: number;
}

interface WorkspaceContext {
    rootPath: string;
    structure: FileTree;
    relevantFiles: FileInfo[];
    dependencies: PackageInfo[];
}
```

#### 3. Embedding Service (`IEmbeddingService`)

Manages codebase embeddings for semantic search.

```typescript
interface IEmbeddingService {
    // Index management
    indexWorkspace(rootPath: string): Promise<void>;
    updateIndex(files: URI[]): Promise<void>;
    clearIndex(): Promise<void>;

    // Search
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    findSimilar(code: string, options?: SearchOptions): Promise<SearchResult[]>;

    // Status
    getIndexStatus(): IndexStatus;
}

interface SearchOptions {
    maxResults?: number;
    threshold?: number;
    fileTypes?: string[];
    excludePaths?: string[];
}

interface SearchResult {
    file: URI;
    chunk: CodeChunk;
    score: number;
    context: string;
}

interface CodeChunk {
    content: string;
    startLine: number;
    endLine: number;
    type: 'function' | 'class' | 'block' | 'file';
}

interface IndexStatus {
    isIndexing: boolean;
    totalFiles: number;
    indexedFiles: number;
    lastIndexed: Date;
}
```

#### 4. Cache Service (`ICacheService`)

Caches AI responses for performance and cost optimization.

```typescript
interface ICacheService {
    // Get/Set
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;

    // Specialized methods
    getCachedCompletion(prompt: string): Promise<string | undefined>;
    cacheCompletion(prompt: string, completion: string): Promise<void>;

    // Management
    clear(): Promise<void>;
    getStats(): CacheStats;
}

interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
}
```

### Layer 3: Feature Implementations

#### 1. Tab Autocomplete

**File**: `src/vs/workbench/contrib/risingbird/browser/autocomplete/completionProvider.ts`

```typescript
class RisingBirdCompletionProvider implements InlineCompletionItemProvider {
    async provideInlineCompletionItems(
        document: TextDocument,
        position: Position,
        context: InlineCompletionContext,
        token: CancellationToken
    ): Promise<InlineCompletionList> {
        // 1. Check if we should provide completions
        if (!this.shouldProvideCompletion(document, position)) {
            return { items: [] };
        }

        // 2. Build context
        const codeContext = await this.contextBuilder.buildEditorContext(
            this.editorService.getActiveEditor()
        );

        // 3. Check cache
        const cacheKey = this.buildCacheKey(document, position, codeContext);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // 4. Build prompt
        const prompt = this.buildCompletionPrompt(document, position, codeContext);

        // 5. Get AI completion
        const completion = await this.aiService.complete({
            prompt,
            context: codeContext,
            maxTokens: 500,
            temperature: 0.2
        });

        // 6. Parse and format completion
        const items = this.parseCompletion(completion, position);

        // 7. Cache result
        await this.cache.set(cacheKey, { items }, 300); // 5 min TTL

        return { items };
    }

    private shouldProvideCompletion(document: TextDocument, position: Position): boolean {
        // Don't provide in comments (unless doc comments)
        // Don't provide in strings
        // Don't provide if just typed a space
        // etc.
    }

    private buildCompletionPrompt(
        document: TextDocument,
        position: Position,
        context: CodeContext
    ): string {
        // Build prompt with:
        // - File context
        // - Recent changes
        // - Cursor position
        // - Relevant imports
    }
}
```

**Debouncing Strategy**:
- Trigger after 150ms of no typing
- Cancel previous requests
- Show loading indicator after 300ms

**Multi-line Support**:
- Parse completion for multiple lines
- Show ghost text for all lines
- Accept with Tab, reject with Esc
- Partial acceptance with Cmd+Right Arrow

#### 2. Chat Interface

**File**: `src/vs/workbench/contrib/risingbird/browser/chat/risingbirdChatView.ts`

```typescript
class RisingBirdChatView extends ViewPane {
    private chatWidget: ChatWidget;
    private sessionManager: ChatSessionManager;

    async sendMessage(message: string): Promise<void> {
        // 1. Add user message to UI
        this.chatWidget.addMessage({
            role: 'user',
            content: message,
            timestamp: Date.now()
        });

        // 2. Build context
        const context = await this.contextBuilder.buildWorkspaceContext({
            includeOpenFiles: true,
            maxFiles: 10
        });

        // 3. Process slash commands
        if (message.startsWith('/')) {
            return this.handleSlashCommand(message, context);
        }

        // 4. Get chat history
        const history = this.sessionManager.getCurrentSession().messages;

        // 5. Stream AI response
        const responseMessage = this.chatWidget.addMessage({
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            streaming: true
        });

        try {
            for await (const chunk of this.aiService.streamChat(history, { context })) {
                responseMessage.appendContent(chunk.content);
                this.chatWidget.update();
            }
            responseMessage.streaming = false;
        } catch (error) {
            this.handleError(error, responseMessage);
        }
    }

    private async handleSlashCommand(command: string, context: CodeContext): Promise<void> {
        const [cmd, ...args] = command.split(' ');

        switch (cmd) {
            case '/edit':
                return this.handleEditCommand(args.join(' '), context);
            case '/fix':
                return this.handleFixCommand(context);
            case '/explain':
                return this.handleExplainCommand(context);
            case '/test':
                return this.handleTestCommand(context);
            // ... more commands
        }
    }
}
```

**Chat Features**:
- Persistent sessions
- Code block rendering with syntax highlighting
- Apply changes button for code blocks
- Diff view for changes
- File references with click-to-open
- Copy code button
- Regenerate response
- Edit previous message

#### 3. Inline Edit (Cmd+K)

**File**: `src/vs/workbench/contrib/risingbird/browser/inlineEdit/quickEditWidget.ts`

```typescript
class QuickEditWidget extends Widget {
    private inputBox: InputBox;
    private suggestionsView: SuggestionsView;
    private currentSession: EditSession | null = null;

    async show(editor: ICodeEditor, range?: Range): Promise<void> {
        // 1. Position widget
        const position = range?.getStartPosition() || editor.getPosition();
        this.positionWidget(editor, position);

        // 2. Build context
        const context = await this.contextBuilder.buildEditorContext(editor);

        // 3. Show widget
        this.inputBox.focus();

        // 4. Listen for input
        this.inputBox.onDidChange(async (value) => {
            if (value.length > 3) {
                await this.generateSuggestions(value, context, range);
            }
        });
    }

    private async generateSuggestions(
        instruction: string,
        context: CodeContext,
        range?: Range
    ): Promise<void> {
        // Cancel previous request
        this.currentSession?.cancel();

        // Create new session
        this.currentSession = new EditSession(instruction, context, range);

        // Build prompt
        const prompt = this.buildEditPrompt(instruction, context, range);

        // Stream suggestions
        this.suggestionsView.clear();
        this.suggestionsView.showLoading();

        try {
            const suggestions: string[] = [];

            for await (const chunk of this.aiService.streamComplete({ prompt, context })) {
                suggestions[0] = (suggestions[0] || '') + chunk;
                this.suggestionsView.update(suggestions);
            }

            this.currentSession.suggestions = suggestions;
        } catch (error) {
            this.suggestionsView.showError(error);
        }
    }

    async acceptSuggestion(index: number): Promise<void> {
        if (!this.currentSession) return;

        const suggestion = this.currentSession.suggestions[index];
        const editor = this.editorService.getActiveEditor();

        // Apply edit
        await editor.executeEdits('risingbird', [{
            range: this.currentSession.range,
            text: suggestion
        }]);

        // Close widget
        this.hide();
    }
}
```

**Keyboard Shortcuts**:
- `Cmd+K` / `Ctrl+K` - Open inline edit
- `Enter` - Accept first suggestion
- `Cmd+1/2/3` - Accept suggestion 1/2/3
- `Esc` - Cancel
- `Tab` - Cycle through suggestions

#### 4. Composer/Agent Mode

**File**: `src/vs/workbench/contrib/risingbird/browser/composer/composerView.ts`

```typescript
class ComposerView extends ViewPane {
    private agentOrchestrator: AgentOrchestrator;
    private changeManager: FileChangeManager;
    private previewPanel: ChangePreviewPanel;

    async executeTask(task: string): Promise<void> {
        // 1. Parse task into steps
        const plan = await this.agentOrchestrator.planTask(task);

        // 2. Show plan to user
        this.showPlan(plan);

        // 3. Execute steps
        for (const step of plan.steps) {
            await this.executeStep(step);
        }

        // 4. Show preview of all changes
        const changes = this.changeManager.getAllChanges();
        this.previewPanel.show(changes);

        // 5. Wait for user approval
        const approved = await this.previewPanel.waitForApproval();

        if (approved) {
            await this.applyChanges(changes);
        } else {
            this.changeManager.rollback();
        }
    }

    private async executeStep(step: TaskStep): Promise<void> {
        this.showProgress(`Executing: ${step.description}`);

        switch (step.type) {
            case 'create_file':
                await this.createFile(step.path, step.content);
                break;
            case 'modify_file':
                await this.modifyFile(step.path, step.changes);
                break;
            case 'delete_file':
                await this.deleteFile(step.path);
                break;
            case 'run_command':
                await this.runCommand(step.command);
                break;
        }
    }
}

class AgentOrchestrator {
    async planTask(task: string): Promise<TaskPlan> {
        // 1. Understand task
        const understanding = await this.understandTask(task);

        // 2. Search codebase for relevant files
        const relevantFiles = await this.embeddingService.search(task, {
            maxResults: 20
        });

        // 3. Generate plan
        const plan = await this.generatePlan(understanding, relevantFiles);

        // 4. Validate plan
        const validatedPlan = await this.validatePlan(plan);

        return validatedPlan;
    }

    private async generatePlan(
        understanding: TaskUnderstanding,
        relevantFiles: SearchResult[]
    ): Promise<TaskPlan> {
        const prompt = this.buildPlanningPrompt(understanding, relevantFiles);

        const response = await this.aiService.chat([
            { role: 'system', content: AGENT_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ]);

        return this.parsePlan(response.message.content);
    }
}
```

**Agent Capabilities**:
- Multi-step task planning
- File creation/modification/deletion
- Terminal command execution
- Test running
- Git operations
- Dependency installation
- Code refactoring
- Documentation generation

### Layer 4: UI Components

#### Status Bar Integration

```typescript
class RisingBirdStatusBar {
    private statusBarItem: StatusBarItem;

    constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Right,
            100
        );

        this.updateStatus();
    }

    private updateStatus(): void {
        const provider = this.aiService.getActiveProvider();
        const model = this.configService.getValue('risingbird.ai.model');

        this.statusBarItem.text = `$(sparkle) ${provider.name} (${model})`;
        this.statusBarItem.tooltip = 'Click to change AI model';
        this.statusBarItem.command = 'risingbird.selectModel';

        this.statusBarItem.show();
    }
}
```

## Performance Optimizations

### 1. Request Debouncing

```typescript
class DebouncedAIService {
    private pendingRequests = new Map<string, AbortController>();

    async complete(options: CompletionOptions): Promise<string> {
        const key = this.buildRequestKey(options);

        // Cancel previous request
        this.pendingRequests.get(key)?.abort();

        // Create new abort controller
        const controller = new AbortController();
        this.pendingRequests.set(key, controller);

        // Wait for debounce period
        await this.debounce(150);

        // Make request
        try {
            return await this.aiService.complete(options, controller.signal);
        } finally {
            this.pendingRequests.delete(key);
        }
    }
}
```

### 2. Incremental Indexing

```typescript
class IncrementalIndexer {
    async onFileChange(uri: URI, changeType: FileChangeType): Promise<void> {
        switch (changeType) {
            case FileChangeType.ADDED:
            case FileChangeType.UPDATED:
                await this.indexFile(uri);
                break;
            case FileChangeType.DELETED:
                await this.removeFromIndex(uri);
                break;
        }
    }

    private async indexFile(uri: URI): Promise<void> {
        // 1. Read file
        const content = await this.fileService.readFile(uri);

        // 2. Parse into chunks
        const chunks = this.chunkFile(content, uri);

        // 3. Generate embeddings (batched)
        const embeddings = await this.embeddingService.generateBatch(
            chunks.map(c => c.content)
        );

        // 4. Store in index
        await this.indexStorage.upsert(uri, chunks, embeddings);
    }
}
```

### 3. Response Streaming

```typescript
async function* streamResponse(
    provider: IAIProvider,
    request: CompletionRequest
): AsyncIterable<string> {
    const stream = provider.streamComplete(request);

    let buffer = '';

    for await (const chunk of stream) {
        buffer += chunk.text;

        // Emit complete tokens only
        const tokens = buffer.split(/(\s+)/);
        const complete = tokens.slice(0, -1).join('');
        buffer = tokens[tokens.length - 1];

        if (complete) {
            yield complete;
        }
    }

    // Emit remaining buffer
    if (buffer) {
        yield buffer;
    }
}
```

### 4. Smart Caching

```typescript
class SmartCache {
    private cache = new LRUCache<string, CacheEntry>({
        max: 1000,
        ttl: 1000 * 60 * 5 // 5 minutes
    });

    async get(key: string): Promise<string | undefined> {
        const entry = this.cache.get(key);

        if (!entry) {
            return undefined;
        }

        // Check if context has changed
        if (await this.hasContextChanged(entry.context)) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    private async hasContextChanged(context: CodeContext): Promise<boolean> {
        // Check if relevant files have been modified
        for (const file of context.openFiles || []) {
            const stat = await this.fileService.stat(URI.file(file.path));
            if (stat.mtime > context.timestamp) {
                return true;
            }
        }
        return false;
    }
}
```

## Security & Privacy

### 1. API Key Management

```typescript
class SecureKeyStorage {
    constructor(
        @ISecretStorageService private secretStorage: ISecretStorageService
    ) {}

    async storeApiKey(provider: string, key: string): Promise<void> {
        await this.secretStorage.set(`risingbird.apiKey.${provider}`, key);
    }

    async getApiKey(provider: string): Promise<string | undefined> {
        return await this.secretStorage.get(`risingbird.apiKey.${provider}`);
    }

    async deleteApiKey(provider: string): Promise<void> {
        await this.secretStorage.delete(`risingbird.apiKey.${provider}`);
    }
}
```

### 2. Privacy Mode

```typescript
class PrivacyManager {
    async shouldSendToCloud(content: string, uri: URI): Promise<boolean> {
        const mode = this.configService.getValue('risingbird.privacy.mode');

        if (mode === 'local') {
            return false;
        }

        if (mode === 'cloud') {
            return true;
        }

        // Hybrid mode - check file patterns
        const patterns = this.configService.getValue('risingbird.privacy.excludePatterns');

        for (const pattern of patterns) {
            if (minimatch(uri.path, pattern)) {
                return false;
            }
        }

        // Check for sensitive content
        if (this.containsSensitiveData(content)) {
            const allow = await this.promptUser(
                'This content may contain sensitive data. Send to cloud?'
            );
            return allow;
        }

        return true;
    }

    private containsSensitiveData(content: string): boolean {
        // Check for API keys, passwords, tokens, etc.
        const patterns = [
            /api[_-]?key/i,
            /password/i,
            /secret/i,
            /token/i,
            /private[_-]?key/i
        ];

        return patterns.some(p => p.test(content));
    }
}
```

### 3. Code Sanitization

```typescript
class CodeSanitizer {
    sanitizeCompletion(code: string): SanitizedCode {
        const warnings: string[] = [];

        // Check for dangerous operations
        if (/rm\s+-rf\s+\//.test(code)) {
            warnings.push('Contains dangerous file deletion command');
        }

        if (/eval\(/.test(code)) {
            warnings.push('Contains eval() which can be dangerous');
        }

        if (/exec\(/.test(code)) {
            warnings.push('Contains exec() which can execute arbitrary code');
        }

        // Check for hardcoded credentials
        if (this.containsCredentials(code)) {
            warnings.push('Contains what appears to be hardcoded credentials');
        }

        return {
            code,
            warnings,
            requiresConfirmation: warnings.length > 0
        };
    }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('RisingBirdCompletionProvider', () => {
    let provider: RisingBirdCompletionProvider;
    let mockAIService: MockAIService;

    beforeEach(() => {
        mockAIService = new MockAIService();
        provider = new RisingBirdCompletionProvider(mockAIService);
    });

    it('should provide completions for valid positions', async () => {
        const document = createMockDocument('function test() {\n  ');
        const position = new Position(1, 2);

        mockAIService.setResponse('console.log("test");');

        const result = await provider.provideInlineCompletionItems(
            document,
            position,
            { triggerKind: InlineCompletionTriggerKind.Automatic },
            CancellationToken.None
        );

        expect(result.items).toHaveLength(1);
        expect(result.items[0].insertText).toBe('console.log("test");');
    });

    it('should not provide completions in comments', async () => {
        const document = createMockDocument('// test');
        const position = new Position(0, 7);

        const result = await provider.provideInlineCompletionItems(
            document,
            position,
            { triggerKind: InlineCompletionTriggerKind.Automatic },
            CancellationToken.None
        );

        expect(result.items).toHaveLength(0);
    });
});
```

### Integration Tests

```typescript
describe('Chat Integration', () => {
    it('should handle complete chat workflow', async () => {
        // 1. Open chat view
        await commands.executeCommand('risingbird.chat.open');

        // 2. Send message
        await chatView.sendMessage('Create a hello world function');

        // 3. Wait for response
        await waitForResponse();

        // 4. Verify response contains code
        const response = chatView.getLastMessage();
        expect(response.content).toContain('function');
        expect(response.content).toContain('hello');

        // 5. Apply code
        await chatView.applyCode(0);

        // 6. Verify code was inserted
        const editor = window.activeTextEditor;
        expect(editor.document.getText()).toContain('function');
    });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
    it('should provide completions within 300ms', async () => {
        const start = Date.now();

        await provider.provideInlineCompletionItems(
            document,
            position,
            context,
            token
        );

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(300);
    });

    it('should handle 1000 files indexing in under 10s', async () => {
        const files = generateMockFiles(1000);

        const start = Date.now();
        await indexer.indexFiles(files);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10000);
    });
});
```

## Monitoring & Telemetry

### Metrics to Track

1. **Performance Metrics**:
   - Completion latency (p50, p95, p99)
   - Chat response time
   - Indexing speed
   - Memory usage
   - CPU usage

2. **Usage Metrics**:
   - Completions shown
   - Completions accepted
   - Acceptance rate
   - Chat messages sent
   - Commands executed
   - Features used

3. **Quality Metrics**:
   - Error rate
   - Timeout rate
   - Cache hit rate
   - User satisfaction ratings

4. **Cost Metrics**:
   - API calls made
   - Tokens used
   - Cost per user
   - Cache savings

### Telemetry Implementation

```typescript
class TelemetryService {
    trackCompletion(event: CompletionEvent): void {
        this.telemetry.publicLog2('risingbird.completion', {
            accepted: event.accepted,
            latency: event.latency,
            length: event.completion.length,
            provider: event.provider,
            cached: event.cached
        });
    }

    trackChatMessage(event: ChatEvent): void {
        this.telemetry.publicLog2('risingbird.chat', {
            messageLength: event.message.length,
            responseTime: event.responseTime,
            tokensUsed: event.tokensUsed,
            provider: event.provider
        });
    }
}
```

## Deployment & Distribution

### Build Configuration

```typescript
// build/gulpfile.risingbird.js
const gulp = require('gulp');
const typescript = require('gulp-typescript');

gulp.task('compile-risingbird', () => {
    return gulp.src('src/vs/workbench/contrib/risingbird/**/*.ts')
        .pipe(typescript({
            target: 'ES2020',
            module: 'commonjs',
            strict: true
        }))
        .pipe(gulp.dest('out/vs/workbench/contrib/risingbird'));
});
```

### Package Configuration

```json
{
  "name": "risingbird",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "dependencies": {
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "@google/generative-ai": "^0.1.0"
  }
}
```

## Conclusion

This technical architecture provides a solid foundation for implementing Cursor-like features in RisingBird. The modular design allows for incremental development and testing, while the performance optimizations ensure the editor remains responsive.

Key architectural decisions:
1. **Provider abstraction** - Easy to add new AI providers
2. **Service-oriented** - Clear separation of concerns
3. **Performance-focused** - Caching, streaming, debouncing
4. **Privacy-first** - User control over data
5. **Testable** - Comprehensive test coverage

Next steps:
1. Implement core services (Phase 1)
2. Build autocomplete provider (Phase 2)
3. Develop chat interface (Phase 3)
4. Add remaining features (Phases 4-6)
5. Polish and optimize (Phases 7-8)

