/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../../base/common/cancellation.js';
import { Emitter } from '../../../../../base/common/event.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { ILogService } from '../../../../../platform/log/common/log.js';
import { BaseAIProvider, IProviderStatus, IValidationResult } from '../aiProvider.js';
import { ModelContextWindows, ModelIds, ProviderId, RisingBirdConfigKeys } from '../constants.js';
import {
	IChatOptions,
	IChatResponse,
	ICompletionOptions,
	ICompletionResponse,
	IModelInfo,
	IStreamChunk,
	RisingBirdError,
	RisingBirdErrorType
} from '../types.js';

/**
 * OpenAI provider implementation
 * Note: This is a placeholder implementation. Full implementation requires OpenAI SDK.
 */
export class OpenAIProvider extends BaseAIProvider {
	readonly id = ProviderId.OpenAI;
	readonly name = 'OpenAI';

	readonly models: readonly IModelInfo[] = [
		{
			id: ModelIds.GPT4o,
			name: 'GPT-4o',
			provider: this.id,
			contextWindow: ModelContextWindows[ModelIds.GPT4o],
			maxOutputTokens: 4096,
			supportsStreaming: true,
			supportsFunctions: true
		},
		{
			id: ModelIds.GPT4Turbo,
			name: 'GPT-4 Turbo',
			provider: this.id,
			contextWindow: ModelContextWindows[ModelIds.GPT4Turbo],
			maxOutputTokens: 4096,
			supportsStreaming: true,
			supportsFunctions: true
		},
		{
			id: ModelIds.GPT4,
			name: 'GPT-4',
			provider: this.id,
			contextWindow: ModelContextWindows[ModelIds.GPT4],
			maxOutputTokens: 4096,
			supportsStreaming: true,
			supportsFunctions: true
		},
		{
			id: ModelIds.GPT35Turbo,
			name: 'GPT-3.5 Turbo',
			provider: this.id,
			contextWindow: ModelContextWindows[ModelIds.GPT35Turbo],
			maxOutputTokens: 4096,
			supportsStreaming: true,
			supportsFunctions: true
		}
	];

	private readonly _onDidChangeStatus = new Emitter<IProviderStatus>();
	readonly onDidChangeStatus = this._onDidChangeStatus.event;

	private _apiKey: string | undefined;
	// private _baseUrl: string | undefined;  // TODO: Will be used for custom endpoints in Phase 2

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@ILogService private readonly logService: ILogService
	) {
		super();

		this._loadConfiguration();

		// Listen for configuration changes (properly registered for disposal)
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(RisingBirdConfigKeys.OpenAIApiKey) ||
				e.affectsConfiguration(RisingBirdConfigKeys.OpenAIBaseUrl)) {
				this._loadConfiguration();
				this._updateStatus();
			}
		}));

		this._updateStatus();
	}

	getStatus(): IProviderStatus {
		return this._status;
	}

	isConfigured(): boolean {
		return !!this._apiKey;
	}

	async validateConfiguration(): Promise<IValidationResult> {
		if (!this._apiKey) {
			return {
				valid: false,
				error: 'OpenAI API key is not configured',
				details: {
					apiKeyValid: false
				}
			};
		}

		// TODO: Make a test API call to validate the key
		// For now, just check if key exists
		return {
			valid: true,
			details: {
				apiKeyValid: true,
				modelsAvailable: true
			}
		};
	}

	async complete(
		options: ICompletionOptions,
		token: CancellationToken
	): Promise<ICompletionResponse> {
		this._ensureConfigured();

		this.validateModel(options.model);

		// TODO: Implement actual OpenAI API call
		// Will use: model, this._apiKey, this._baseUrl
		// This is a placeholder implementation
		this.logService.warn('OpenAI provider not fully implemented yet');

		throw new RisingBirdError(
			'OpenAI provider implementation is in progress. Please check back soon!',
			RisingBirdErrorType.ProviderError
		);
	}

	async *streamComplete(
		options: ICompletionOptions,
		token: CancellationToken
	): AsyncIterable<IStreamChunk> {
		this._ensureConfigured();

		// TODO: Implement streaming
		throw new RisingBirdError(
			'OpenAI streaming not implemented yet',
			RisingBirdErrorType.ProviderError
		);
	}

	async chat(
		options: IChatOptions,
		token: CancellationToken
	): Promise<IChatResponse> {
		this._ensureConfigured();

		this.validateModel(options.model);

		// TODO: Implement actual OpenAI chat API call
		// Will use: model, this._apiKey, this._baseUrl
		throw new RisingBirdError(
			'OpenAI chat not implemented yet',
			RisingBirdErrorType.ProviderError
		);
	}

	async *streamChat(
		options: IChatOptions,
		token: CancellationToken
	): AsyncIterable<IStreamChunk> {
		this._ensureConfigured();

		// TODO: Implement streaming chat
		throw new RisingBirdError(
			'OpenAI streaming chat not implemented yet',
			RisingBirdErrorType.ProviderError
		);
	}

	async generateEmbedding(
		text: string,
		token: CancellationToken
	): Promise<number[]> {
		this._ensureConfigured();

		// TODO: Implement embeddings
		throw new RisingBirdError(
			'OpenAI embeddings not implemented yet',
			RisingBirdErrorType.ProviderError
		);
	}

	private _loadConfiguration(): void {
		this._apiKey = this.configurationService.getValue<string>(RisingBirdConfigKeys.OpenAIApiKey);
		// this._baseUrl = this.configurationService.getValue<string>(RisingBirdConfigKeys.OpenAIBaseUrl);
		// TODO: Uncomment when implementing custom base URL support
	}

	private _updateStatus(): void {
		this._status = {
			available: true,
			configured: this.isConfigured(),
			error: this.isConfigured() ? undefined : 'API key not configured'
		};
		this._onDidChangeStatus.fire(this._status);
	}

	private _ensureConfigured(): void {
		if (!this.isConfigured()) {
			throw new RisingBirdError(
				'OpenAI provider is not configured. Please set your API key in settings.',
				RisingBirdErrorType.AuthenticationError
			);
		}
	}

	override dispose(): void {
		this._onDidChangeStatus.dispose();
		super.dispose();
	}
}

