/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { IAIProvider, IProviderStatus } from './aiProvider.js';
import { IAIService } from './aiService.js';
import { RisingBirdConfigKeys } from './constants.js';
import {
	IChatOptions,
	IChatResponse,
	ICodeContext,
	ICompletionOptions,
	ICompletionResponse,
	IModelInfo,
	IStreamChunk,
	RisingBirdError,
	RisingBirdErrorType
} from './types.js';

/**
 * Implementation of the AI service
 */
export class AIService extends Disposable implements IAIService {
	declare readonly _serviceBrand: undefined;

	private readonly _providers = new Map<string, IAIProvider>();
	private _activeProviderId: string | undefined;

	private readonly _onDidChangeActiveProvider = this._register(new Emitter<string>());
	readonly onDidChangeActiveProvider = this._onDidChangeActiveProvider.event;

	private readonly _onDidChangeProviders = this._register(new Emitter<void>());
	readonly onDidChangeProviders = this._onDidChangeProviders.event;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@ILogService private readonly logService: ILogService
	) {
		super();

		// Load active provider from configuration
		this._activeProviderId = this.configurationService.getValue<string>(RisingBirdConfigKeys.ActiveProvider);

		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(RisingBirdConfigKeys.ActiveProvider)) {
				const newProvider = this.configurationService.getValue<string>(RisingBirdConfigKeys.ActiveProvider);
				if (newProvider && newProvider !== this._activeProviderId) {
					this.setActiveProvider(newProvider).catch(err => {
						this.logService.error('Failed to set active provider:', err);
					});
				}
			}
		}));
	}

	registerProvider(provider: IAIProvider): void {
		if (this._providers.has(provider.id)) {
			this.logService.warn(`Provider ${provider.id} is already registered`);
			return;
		}

		this._providers.set(provider.id, provider);
		this.logService.info(`Registered AI provider: ${provider.name} (${provider.id})`);

		// If this is the first provider or matches the configured active provider, set it as active
		if (!this._activeProviderId || this._activeProviderId === provider.id) {
			this.setActiveProvider(provider.id).catch(err => {
				this.logService.error('Failed to set active provider:', err);
			});
		}

		this._onDidChangeProviders.fire();
	}

	unregisterProvider(providerId: string): void {
		const provider = this._providers.get(providerId);
		if (!provider) {
			return;
		}

		this._providers.delete(providerId);
		provider.dispose();

		this.logService.info(`Unregistered AI provider: ${providerId}`);

		// If this was the active provider, switch to another one
		if (this._activeProviderId === providerId) {
			const firstProvider = this._providers.values().next().value;
			if (firstProvider) {
				this.setActiveProvider(firstProvider.id).catch(err => {
					this.logService.error('Failed to set active provider:', err);
				});
			} else {
				this._activeProviderId = undefined;
			}
		}

		this._onDidChangeProviders.fire();
	}

	getProviders(): readonly IAIProvider[] {
		return Array.from(this._providers.values());
	}

	getProvider(providerId: string): IAIProvider | undefined {
		return this._providers.get(providerId);
	}

	getActiveProvider(): IAIProvider | undefined {
		return this._activeProviderId ? this._providers.get(this._activeProviderId) : undefined;
	}

	async setActiveProvider(providerId: string): Promise<void> {
		const provider = this._providers.get(providerId);
		if (!provider) {
			throw new RisingBirdError(
				`Provider ${providerId} not found`,
				RisingBirdErrorType.ProviderError
			);
		}

		// Validate provider configuration
		const validation = await provider.validateConfiguration();
		if (!validation.valid) {
			throw new RisingBirdError(
				`Provider ${providerId} is not properly configured: ${validation.error}`,
				RisingBirdErrorType.AuthenticationError,
				validation.details
			);
		}

		this._activeProviderId = providerId;
		this.logService.info(`Active AI provider set to: ${provider.name} (${providerId})`);

		// Update configuration
		await this.configurationService.updateValue(
			RisingBirdConfigKeys.ActiveProvider,
			providerId
		);

		this._onDidChangeActiveProvider.fire(providerId);
	}

	getProviderStatus(providerId: string): IProviderStatus | undefined {
		const provider = this._providers.get(providerId);
		return provider?.getStatus();
	}

	getAvailableModels(): readonly IModelInfo[] {
		const models: IModelInfo[] = [];
		for (const provider of this._providers.values()) {
			models.push(...provider.models);
		}
		return models;
	}

	async complete(
		options: ICompletionOptions,
		token: CancellationToken = CancellationToken.None
	): Promise<ICompletionResponse> {
		const provider = this._getProviderForRequest(options.provider);

		try {
			this.logService.trace('Generating completion', { provider: provider.id, model: options.model });
			const response = await provider.complete(options, token);
			this.logService.trace('Completion generated', { tokens: response.usage.totalTokens });
			return response;
		} catch (error) {
			this.logService.error('Failed to generate completion:', error);
			throw this._wrapError(error);
		}
	}

	async *streamComplete(
		options: ICompletionOptions,
		token: CancellationToken = CancellationToken.None
	): AsyncIterable<IStreamChunk> {
		const provider = this._getProviderForRequest(options.provider);

		try {
			this.logService.trace('Streaming completion', { provider: provider.id, model: options.model });
			yield* provider.streamComplete(options, token);
		} catch (error) {
			this.logService.error('Failed to stream completion:', error);
			throw this._wrapError(error);
		}
	}

	async chat(
		options: IChatOptions,
		token: CancellationToken = CancellationToken.None
	): Promise<IChatResponse> {
		const provider = this._getProviderForRequest(options.provider);

		try {
			this.logService.trace('Generating chat response', { provider: provider.id, model: options.model });
			const response = await provider.chat(options, token);
			this.logService.trace('Chat response generated', { tokens: response.usage.totalTokens });
			return response;
		} catch (error) {
			this.logService.error('Failed to generate chat response:', error);
			throw this._wrapError(error);
		}
	}

	async *streamChat(
		options: IChatOptions,
		token: CancellationToken = CancellationToken.None
	): AsyncIterable<IStreamChunk> {
		const provider = this._getProviderForRequest(options.provider);

		try {
			this.logService.trace('Streaming chat response', { provider: provider.id, model: options.model });
			yield* provider.streamChat(options, token);
		} catch (error) {
			this.logService.error('Failed to stream chat response:', error);
			throw this._wrapError(error);
		}
	}

	async generateEmbedding(
		text: string,
		providerId?: string,
		token: CancellationToken = CancellationToken.None
	): Promise<number[]> {
		const provider = this._getProviderForRequest(providerId);

		try {
			this.logService.trace('Generating embedding', { provider: provider.id });
			return await provider.generateEmbedding(text, token);
		} catch (error) {
			this.logService.error('Failed to generate embedding:', error);
			throw this._wrapError(error);
		}
	}

	async completeInEditor(
		context: ICodeContext,
		options: Partial<ICompletionOptions> = {},
		token: CancellationToken = CancellationToken.None
	): Promise<ICompletionResponse> {
		// Build prompt from context
		const prompt = this._buildPromptFromContext(context);

		return this.complete(
			{
				...options,
				prompt,
				context
			},
			token
		);
	}

	async chatWithContext(
		message: string,
		context: ICodeContext,
		options: Partial<IChatOptions> = {},
		token: CancellationToken = CancellationToken.None
	): Promise<IChatResponse> {
		// Build messages with context
		const messages = [
			{
				role: 'user' as const,
				content: message
			}
		];

		return this.chat(
			{
				...options,
				messages,
				context
			},
			token
		);
	}

	isReady(): boolean {
		const provider = this.getActiveProvider();
		return provider !== undefined && provider.isConfigured();
	}

	isProviderConfigured(providerId: string): boolean {
		const provider = this._providers.get(providerId);
		return provider?.isConfigured() ?? false;
	}

	private _getProviderForRequest(providerId?: string): IAIProvider {
		const provider = providerId
			? this._providers.get(providerId)
			: this.getActiveProvider();

		if (!provider) {
			throw new RisingBirdError(
				providerId
					? `Provider ${providerId} not found`
					: 'No active AI provider configured',
				RisingBirdErrorType.ProviderError
			);
		}

		if (!provider.isConfigured()) {
			throw new RisingBirdError(
				`Provider ${provider.id} is not properly configured`,
				RisingBirdErrorType.AuthenticationError
			);
		}

		return provider;
	}

	private _buildPromptFromContext(context: ICodeContext): string {
		let prompt = '';

		if (context.currentFile) {
			prompt += `File: ${context.currentFile.uri.fsPath}\n`;
			prompt += `Language: ${context.currentFile.language}\n\n`;

			if (context.currentFile.selection) {
				prompt += `Selected code:\n${context.currentFile.selection.text}\n\n`;
			} else {
				prompt += `Code:\n${context.currentFile.content}\n\n`;
			}
		}

		if (context.openFiles && context.openFiles.length > 0) {
			prompt += `\nOpen files:\n`;
			for (const file of context.openFiles) {
				prompt += `- ${file.uri.fsPath}\n`;
			}
		}

		return prompt;
	}

	private _wrapError(error: unknown): RisingBirdError {
		if (error instanceof RisingBirdError) {
			return error;
		}

		// Try to determine error type from message
		const message = error instanceof Error ? error.message : String(error);
		let type = RisingBirdErrorType.UnknownError;

		if (message.includes('API key') || message.includes('authentication')) {
			type = RisingBirdErrorType.AuthenticationError;
		} else if (message.includes('rate limit')) {
			type = RisingBirdErrorType.RateLimitError;
		} else if (message.includes('network') || message.includes('connection')) {
			type = RisingBirdErrorType.NetworkError;
		} else if (message.includes('context') || message.includes('too large')) {
			type = RisingBirdErrorType.ContextTooLargeError;
		}

		return new RisingBirdError(message, type, error);
	}

	override dispose(): void {
		// Dispose all providers
		for (const provider of this._providers.values()) {
			provider.dispose();
		}
		this._providers.clear();

		super.dispose();
	}
}

