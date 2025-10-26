/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, ConfigurationScope } from '../../../../platform/configuration/common/configurationRegistry.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from '../../../common/contributions.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import * as nls from '../../../../nls.js';

// Services
import { IAIService } from '../common/aiService.js';
import { AIService } from '../common/aiServiceImpl.js';
import { IContextBuilderService } from '../common/contextBuilder.js';
import { ContextBuilderService } from '../common/contextBuilderImpl.js';
import { CacheService, ICacheService } from '../common/cacheService.js';

// Providers
import { OpenAIProvider } from '../common/providers/openaiProvider.js';

// Constants
import { RisingBirdConfigKeys, RisingBirdDefaults, ProviderId, ModelIds } from '../common/constants.js';

// ===========================
// Register Services
// ===========================

registerSingleton(IAIService, AIService, InstantiationType.Delayed);
registerSingleton(IContextBuilderService, ContextBuilderService, InstantiationType.Delayed);
registerSingleton(ICacheService, CacheService, InstantiationType.Delayed);

// ===========================
// Configuration Schema
// ===========================

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);

configurationRegistry.registerConfiguration({
	id: 'risingbird',
	title: nls.localize('risingbird', "RisingBird"),
	type: 'object',
	properties: {
		[RisingBirdConfigKeys.Enabled]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.enabled', "Enable RisingBird AI features"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.ActiveProvider]: {
			type: 'string',
			enum: [ProviderId.OpenAI, ProviderId.Anthropic, ProviderId.Gemini, ProviderId.Custom],
			default: ProviderId.OpenAI,
			description: nls.localize('risingbird.ai.provider', "Active AI provider"),
			enumDescriptions: [
				nls.localize('provider.openai', "OpenAI (GPT-3.5, GPT-4)"),
				nls.localize('provider.anthropic', "Anthropic (Claude)"),
				nls.localize('provider.gemini', "Google (Gemini)"),
				nls.localize('provider.custom', "Custom provider")
			],
			scope: ConfigurationScope.WINDOW
		},

		// Autocomplete
		[RisingBirdConfigKeys.AutocompleteEnabled]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.autocomplete.enabled', "Enable AI-powered autocomplete"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.AutocompleteMultiline]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.autocomplete.multiline', "Enable multi-line autocomplete suggestions"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.AutocompleteDebounce]: {
			type: 'number',
			default: RisingBirdDefaults.AUTOCOMPLETE_DEBOUNCE_MS,
			minimum: 0,
			maximum: 1000,
			description: nls.localize('risingbird.autocomplete.debounce', "Debounce time in milliseconds before triggering autocomplete"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.AutocompleteMaxTokens]: {
			type: 'number',
			default: RisingBirdDefaults.AUTOCOMPLETE_MAX_TOKENS,
			minimum: 100,
			maximum: 2000,
			description: nls.localize('risingbird.autocomplete.maxTokens', "Maximum tokens for autocomplete suggestions"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.AutocompleteTemperature]: {
			type: 'number',
			default: RisingBirdDefaults.AUTOCOMPLETE_TEMPERATURE,
			minimum: 0,
			maximum: 2,
			description: nls.localize('risingbird.autocomplete.temperature', "Temperature for autocomplete (0 = deterministic, 2 = creative)"),
			scope: ConfigurationScope.WINDOW
		},

		// Chat
		[RisingBirdConfigKeys.ChatEnabled]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.chat.enabled', "Enable AI chat interface"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.ChatPersistHistory]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.chat.persistHistory', "Persist chat history across sessions"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.ChatMaxHistorySize]: {
			type: 'number',
			default: RisingBirdDefaults.CHAT_MAX_HISTORY_SIZE,
			minimum: 10,
			maximum: 1000,
			description: nls.localize('risingbird.chat.maxHistorySize', "Maximum number of chat messages to keep in history"),
			scope: ConfigurationScope.WINDOW
		},

		// Privacy
		[RisingBirdConfigKeys.PrivacyMode]: {
			type: 'string',
			enum: ['cloud', 'local', 'hybrid'],
			default: 'cloud',
			description: nls.localize('risingbird.privacy.mode', "Privacy mode for AI processing"),
			enumDescriptions: [
				nls.localize('privacy.cloud', "Send code to cloud AI providers"),
				nls.localize('privacy.local', "Process locally only (requires local models)"),
				nls.localize('privacy.hybrid', "Ask before sending sensitive code")
			],
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.PrivacyExcludePatterns]: {
			type: 'array',
			items: { type: 'string' },
			default: ['**/.env*', '**/secrets/**', '**/credentials/**'],
			description: nls.localize('risingbird.privacy.excludePatterns', "File patterns to exclude from AI processing"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.PrivacyDetectSensitive]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.privacy.detectSensitive', "Detect and warn about sensitive data (API keys, passwords, etc.)"),
			scope: ConfigurationScope.WINDOW
		},

		// Indexing
		[RisingBirdConfigKeys.IndexingEnabled]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.indexing.enabled', "Enable codebase indexing for better context"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.IndexingAutoIndex]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.indexing.autoIndex', "Automatically index workspace on open"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.IndexingExcludePatterns]: {
			type: 'array',
			items: { type: 'string' },
			default: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
			description: nls.localize('risingbird.indexing.excludePatterns', "File patterns to exclude from indexing"),
			scope: ConfigurationScope.WINDOW
		},

		// Cache
		[RisingBirdConfigKeys.CacheEnabled]: {
			type: 'boolean',
			default: true,
			description: nls.localize('risingbird.cache.enabled', "Enable caching of AI responses for better performance"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.CacheTTL]: {
			type: 'number',
			default: RisingBirdDefaults.CACHE_TTL_SECONDS,
			minimum: 60,
			maximum: 3600,
			description: nls.localize('risingbird.cache.ttl', "Cache time-to-live in seconds"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.CacheMaxSize]: {
			type: 'number',
			default: RisingBirdDefaults.CACHE_MAX_SIZE,
			minimum: 100,
			maximum: 10000,
			description: nls.localize('risingbird.cache.maxSize', "Maximum number of cached items"),
			scope: ConfigurationScope.WINDOW
		},

		// OpenAI Provider
		[RisingBirdConfigKeys.OpenAIApiKey]: {
			type: 'string',
			default: '',
			description: nls.localize('risingbird.providers.openai.apiKey', "OpenAI API key"),
			scope: ConfigurationScope.APPLICATION
		},
		[RisingBirdConfigKeys.OpenAIModel]: {
			type: 'string',
			enum: [ModelIds.GPT4o, ModelIds.GPT4Turbo, ModelIds.GPT4, ModelIds.GPT35Turbo],
			default: ModelIds.GPT4o,
			description: nls.localize('risingbird.providers.openai.model', "OpenAI model to use"),
			scope: ConfigurationScope.WINDOW
		},
		[RisingBirdConfigKeys.OpenAIBaseUrl]: {
			type: 'string',
			default: '',
			description: nls.localize('risingbird.providers.openai.baseUrl', "Custom OpenAI API base URL (optional)"),
			scope: ConfigurationScope.WINDOW
		},

		// Anthropic Provider
		[RisingBirdConfigKeys.AnthropicApiKey]: {
			type: 'string',
			default: '',
			description: nls.localize('risingbird.providers.anthropic.apiKey', "Anthropic API key"),
			scope: ConfigurationScope.APPLICATION
		},
		[RisingBirdConfigKeys.AnthropicModel]: {
			type: 'string',
			enum: [ModelIds.Claude3Opus, ModelIds.Claude3Sonnet, ModelIds.Claude3Haiku],
			default: ModelIds.Claude3Sonnet,
			description: nls.localize('risingbird.providers.anthropic.model', "Anthropic model to use"),
			scope: ConfigurationScope.WINDOW
		},

		// Gemini Provider
		[RisingBirdConfigKeys.GeminiApiKey]: {
			type: 'string',
			default: '',
			description: nls.localize('risingbird.providers.gemini.apiKey', "Google Gemini API key"),
			scope: ConfigurationScope.APPLICATION
		},
		[RisingBirdConfigKeys.GeminiModel]: {
			type: 'string',
			enum: [ModelIds.GeminiPro, ModelIds.Gemini15Pro],
			default: ModelIds.Gemini15Pro,
			description: nls.localize('risingbird.providers.gemini.model', "Gemini model to use"),
			scope: ConfigurationScope.WINDOW
		}
	}
});

// ===========================
// Workbench Contribution
// ===========================

class RisingBirdWorkbenchContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.risingbird';

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IAIService private readonly aiService: IAIService,
		@ILogService private readonly logService: ILogService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();

		this.logService.info('RisingBird: Initializing...');

		// Register AI providers
		this._registerProviders();

		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('risingbird')) {
				const enabled = this.configurationService.getValue<boolean>(RisingBirdConfigKeys.Enabled);
				this.logService.info(`RisingBird: Configuration changed - enabled: ${enabled}`);
			}
		}));

		this.logService.info('RisingBird: Initialized successfully');
	}

	private _registerProviders(): void {
		// Register OpenAI provider
		const openaiProvider = this.instantiationService.createInstance(OpenAIProvider);
		this.aiService.registerProvider(openaiProvider);
		this._register(openaiProvider);

		// TODO: Register other providers (Anthropic, Gemini, etc.)

		this.logService.info('RisingBird: AI providers registered');
	}
}

// Register the workbench contribution
registerWorkbenchContribution2(
	RisingBirdWorkbenchContribution.ID,
	RisingBirdWorkbenchContribution,
	WorkbenchPhase.Eventually
);

