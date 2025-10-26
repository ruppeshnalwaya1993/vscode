/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Event } from '../../../../base/common/event.js';
import { Disposable, IDisposable } from '../../../../base/common/lifecycle.js';
import {
	IChatMessage,
	IChatOptions,
	IChatResponse,
	ICompletionOptions,
	ICompletionResponse,
	IModelInfo,
	IStreamChunk
} from './types.js';

/**
 * Interface for AI providers (OpenAI, Anthropic, etc.)
 */
export interface IAIProvider extends IDisposable {
	/**
	 * Unique identifier for this provider
	 */
	readonly id: string;

	/**
	 * Display name of the provider
	 */
	readonly name: string;

	/**
	 * Available models from this provider
	 */
	readonly models: readonly IModelInfo[];

	/**
	 * Event fired when provider status changes
	 */
	readonly onDidChangeStatus: Event<IProviderStatus>;

	/**
	 * Get current provider status
	 */
	getStatus(): IProviderStatus;

	/**
	 * Check if provider is properly configured
	 */
	isConfigured(): boolean;

	/**
	 * Validate provider configuration (e.g., API key)
	 */
	validateConfiguration(): Promise<IValidationResult>;

	/**
	 * Generate a completion
	 */
	complete(
		options: ICompletionOptions,
		token: CancellationToken
	): Promise<ICompletionResponse>;

	/**
	 * Generate a streaming completion
	 */
	streamComplete(
		options: ICompletionOptions,
		token: CancellationToken
	): AsyncIterable<IStreamChunk>;

	/**
	 * Generate a chat response
	 */
	chat(
		options: IChatOptions,
		token: CancellationToken
	): Promise<IChatResponse>;

	/**
	 * Generate a streaming chat response
	 */
	streamChat(
		options: IChatOptions,
		token: CancellationToken
	): AsyncIterable<IStreamChunk>;

	/**
	 * Generate embeddings for text
	 */
	generateEmbedding(
		text: string,
		token: CancellationToken
	): Promise<number[]>;

	/**
	 * Get model information by ID
	 */
	getModel(modelId: string): IModelInfo | undefined;
}

/**
 * Provider status information
 */
export interface IProviderStatus {
	readonly available: boolean;
	readonly configured: boolean;
	readonly error?: string;
	readonly rateLimitRemaining?: number;
	readonly rateLimitReset?: Date;
}

/**
 * Validation result for provider configuration
 */
export interface IValidationResult {
	readonly valid: boolean;
	readonly error?: string;
	readonly details?: {
		readonly apiKeyValid?: boolean;
		readonly modelsAvailable?: boolean;
		readonly quotaRemaining?: boolean;
	};
}

/**
 * Base class for AI providers
 */
export abstract class BaseAIProvider extends Disposable implements IAIProvider {
	abstract readonly id: string;
	abstract readonly name: string;
	abstract readonly models: readonly IModelInfo[];
	abstract readonly onDidChangeStatus: Event<IProviderStatus>;

	protected _status: IProviderStatus = {
		available: false,
		configured: false
	};

	abstract getStatus(): IProviderStatus;
	abstract isConfigured(): boolean;
	abstract validateConfiguration(): Promise<IValidationResult>;
	abstract complete(options: ICompletionOptions, token: CancellationToken): Promise<ICompletionResponse>;
	abstract streamComplete(options: ICompletionOptions, token: CancellationToken): AsyncIterable<IStreamChunk>;
	abstract chat(options: IChatOptions, token: CancellationToken): Promise<IChatResponse>;
	abstract streamChat(options: IChatOptions, token: CancellationToken): AsyncIterable<IStreamChunk>;
	abstract generateEmbedding(text: string, token: CancellationToken): Promise<number[]>;

	getModel(modelId: string): IModelInfo | undefined {
		return this.models.find(m => m.id === modelId);
	}

	override dispose(): void {
		super.dispose();
	}

	/**
	 * Helper to count tokens (approximate)
	 */
	protected estimateTokens(text: string): number {
		// Rough estimation: ~4 characters per token
		return Math.ceil(text.length / 4);
	}

	/**
	 * Helper to validate model ID
	 */
	protected validateModel(modelId?: string): string {
		if (!modelId) {
			return this.models[0].id;
		}
		const model = this.getModel(modelId);
		if (!model) {
			throw new Error(`Model ${modelId} not found for provider ${this.id}`);
		}
		return modelId;
	}

	/**
	 * Helper to build system message
	 */
	protected buildSystemMessage(context?: string): IChatMessage {
		let content = 'You are an AI coding assistant integrated into a code editor. ';
		content += 'Provide helpful, accurate, and concise responses. ';
		content += 'When generating code, ensure it is correct, well-formatted, and follows best practices.';

		if (context) {
			content += `\n\nContext:\n${context}`;
		}

		return {
			role: 'system',
			content
		};
	}
}

