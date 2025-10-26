/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Configuration keys for RisingBird settings
 */
export const enum RisingBirdConfigKeys {
	Enabled = 'risingbird.enabled',
	ActiveProvider = 'risingbird.ai.provider',

	// Autocomplete
	AutocompleteEnabled = 'risingbird.autocomplete.enabled',
	AutocompleteMultiline = 'risingbird.autocomplete.multiline',
	AutocompleteDebounce = 'risingbird.autocomplete.debounceMs',
	AutocompleteMaxTokens = 'risingbird.autocomplete.maxTokens',
	AutocompleteTemperature = 'risingbird.autocomplete.temperature',

	// Chat
	ChatEnabled = 'risingbird.chat.enabled',
	ChatPersistHistory = 'risingbird.chat.persistHistory',
	ChatMaxHistorySize = 'risingbird.chat.maxHistorySize',

	// Privacy
	PrivacyMode = 'risingbird.privacy.mode',
	PrivacyExcludePatterns = 'risingbird.privacy.excludePatterns',
	PrivacyDetectSensitive = 'risingbird.privacy.detectSensitiveData',

	// Indexing
	IndexingEnabled = 'risingbird.indexing.enabled',
	IndexingAutoIndex = 'risingbird.indexing.autoIndex',
	IndexingExcludePatterns = 'risingbird.indexing.excludePatterns',

	// Cache
	CacheEnabled = 'risingbird.cache.enabled',
	CacheTTL = 'risingbird.cache.ttlSeconds',
	CacheMaxSize = 'risingbird.cache.maxSize',

	// Provider specific
	OpenAIApiKey = 'risingbird.providers.openai.apiKey',
	OpenAIModel = 'risingbird.providers.openai.model',
	OpenAIBaseUrl = 'risingbird.providers.openai.baseUrl',

	AnthropicApiKey = 'risingbird.providers.anthropic.apiKey',
	AnthropicModel = 'risingbird.providers.anthropic.model',

	GeminiApiKey = 'risingbird.providers.gemini.apiKey',
	GeminiModel = 'risingbird.providers.gemini.model',
}

/**
 * Default values for configuration
 */
export const RisingBirdDefaults = {
	// Autocomplete
	AUTOCOMPLETE_DEBOUNCE_MS: 150,
	AUTOCOMPLETE_MAX_TOKENS: 500,
	AUTOCOMPLETE_TEMPERATURE: 0.2,

	// Chat
	CHAT_MAX_HISTORY_SIZE: 100,
	CHAT_MAX_TOKENS: 2000,
	CHAT_TEMPERATURE: 0.7,

	// Cache
	CACHE_TTL_SECONDS: 300, // 5 minutes
	CACHE_MAX_SIZE: 1000,

	// Context
	MAX_CONTEXT_FILES: 10,
	MAX_CONTEXT_SIZE: 50000, // characters

	// Indexing
	INDEX_CHUNK_SIZE: 1000, // lines
	INDEX_BATCH_SIZE: 10, // files
};

/**
 * Provider IDs
 */
export const enum ProviderId {
	OpenAI = 'openai',
	Anthropic = 'anthropic',
	Gemini = 'gemini',
	Custom = 'custom',
}

/**
 * Model IDs
 */
export const ModelIds = {
	// OpenAI
	GPT35Turbo: 'gpt-3.5-turbo',
	GPT4: 'gpt-4',
	GPT4Turbo: 'gpt-4-turbo-preview',
	GPT4o: 'gpt-4o',

	// Anthropic
	Claude2: 'claude-2',
	Claude3Opus: 'claude-3-opus-20240229',
	Claude3Sonnet: 'claude-3-sonnet-20240229',
	Claude3Haiku: 'claude-3-haiku-20240307',

	// Google
	GeminiPro: 'gemini-pro',
	Gemini15Pro: 'gemini-1.5-pro',
};

/**
 * Context window sizes for models
 */
export const ModelContextWindows: Record<string, number> = {
	[ModelIds.GPT35Turbo]: 16385,
	[ModelIds.GPT4]: 8192,
	[ModelIds.GPT4Turbo]: 128000,
	[ModelIds.GPT4o]: 128000,
	[ModelIds.Claude2]: 100000,
	[ModelIds.Claude3Opus]: 200000,
	[ModelIds.Claude3Sonnet]: 200000,
	[ModelIds.Claude3Haiku]: 200000,
	[ModelIds.GeminiPro]: 32768,
	[ModelIds.Gemini15Pro]: 1048576,
};

/**
 * Command IDs
 */
export const enum CommandId {
	// Chat
	OpenChat = 'risingbird.chat.open',
	NewChat = 'risingbird.chat.new',
	ClearChat = 'risingbird.chat.clear',

	// Inline Edit
	StartInlineEdit = 'risingbird.inlineEdit.start',
	AcceptInlineEdit = 'risingbird.inlineEdit.accept',
	RejectInlineEdit = 'risingbird.inlineEdit.reject',

	// Composer
	OpenComposer = 'risingbird.composer.open',

	// Settings
	SelectModel = 'risingbird.selectModel',
	SelectProvider = 'risingbird.selectProvider',
	ConfigureSettings = 'risingbird.configureSettings',

	// Indexing
	IndexWorkspace = 'risingbird.indexWorkspace',
	ClearIndex = 'risingbird.clearIndex',

	// Utilities
	ShowStatus = 'risingbird.showStatus',
	ShowUsage = 'risingbird.showUsage',
}

/**
 * Context keys for when clauses
 */
export const enum ContextKey {
	Enabled = 'risingbird.enabled',
	AutocompleteEnabled = 'risingbird.autocomplete.enabled',
	ChatOpen = 'risingbird.chat.open',
	InlineEditActive = 'risingbird.inlineEdit.active',
	ComposerOpen = 'risingbird.composer.open',
	Indexing = 'risingbird.indexing',
	HasApiKey = 'risingbird.hasApiKey',
}

/**
 * View IDs
 */
export const enum ViewId {
	Chat = 'risingbird.chat',
	Composer = 'risingbird.composer',
}

/**
 * View container ID
 */
export const VIEW_CONTAINER_ID = 'risingbird';

/**
 * Sensitive data patterns to detect
 */
export const SENSITIVE_PATTERNS = [
	/api[_-]?key/i,
	/password/i,
	/secret/i,
	/token/i,
	/private[_-]?key/i,
	/access[_-]?key/i,
	/auth[_-]?token/i,
	/bearer/i,
	/credentials/i,
];

/**
 * Default exclude patterns for indexing
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
	'**/node_modules/**',
	'**/dist/**',
	'**/build/**',
	'**/out/**',
	'**/.git/**',
	'**/.vscode/**',
	'**/*.min.js',
	'**/*.bundle.js',
	'**/.env*',
	'**/package-lock.json',
	'**/yarn.lock',
];

/**
 * Supported file extensions for indexing
 */
export const SUPPORTED_EXTENSIONS = [
	'.ts', '.tsx', '.js', '.jsx',
	'.py', '.java', '.c', '.cpp', '.h', '.hpp',
	'.cs', '.go', '.rs', '.rb', '.php',
	'.swift', '.kt', '.scala', '.r',
	'.html', '.css', '.scss', '.sass',
	'.json', '.yaml', '.yml', '.xml',
	'.md', '.txt',
];

/**
 * Telemetry event names
 */
export const enum TelemetryEvent {
	CompletionShown = 'risingbird.completion.shown',
	CompletionAccepted = 'risingbird.completion.accepted',
	CompletionRejected = 'risingbird.completion.rejected',
	ChatMessageSent = 'risingbird.chat.messageSent',
	ChatCodeApplied = 'risingbird.chat.codeApplied',
	InlineEditStarted = 'risingbird.inlineEdit.started',
	InlineEditAccepted = 'risingbird.inlineEdit.accepted',
	ComposerTaskStarted = 'risingbird.composer.taskStarted',
	ComposerTaskCompleted = 'risingbird.composer.taskCompleted',
	IndexingStarted = 'risingbird.indexing.started',
	IndexingCompleted = 'risingbird.indexing.completed',
	Error = 'risingbird.error',
}

