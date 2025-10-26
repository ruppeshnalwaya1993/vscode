/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Event } from '../../../../base/common/event.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IAIProvider, IProviderStatus } from './aiProvider.js';
import {
	IChatOptions,
	IChatResponse,
	ICodeContext,
	ICompletionOptions,
	ICompletionResponse,
	IModelInfo,
	IStreamChunk
} from './types.js';

export const IAIService = createDecorator<IAIService>('aiService');

/**
 * Main AI service that orchestrates AI providers and requests
 */
export interface IAIService {
	readonly _serviceBrand: undefined;

	/**
	 * Event fired when the active provider changes
	 */
	readonly onDidChangeActiveProvider: Event<string>;

	/**
	 * Event fired when a provider is added or removed
	 */
	readonly onDidChangeProviders: Event<void>;

	/**
	 * Register an AI provider
	 */
	registerProvider(provider: IAIProvider): void;

	/**
	 * Unregister an AI provider
	 */
	unregisterProvider(providerId: string): void;

	/**
	 * Get all registered providers
	 */
	getProviders(): readonly IAIProvider[];

	/**
	 * Get a specific provider by ID
	 */
	getProvider(providerId: string): IAIProvider | undefined;

	/**
	 * Get the currently active provider
	 */
	getActiveProvider(): IAIProvider | undefined;

	/**
	 * Set the active provider
	 */
	setActiveProvider(providerId: string): Promise<void>;

	/**
	 * Get provider status
	 */
	getProviderStatus(providerId: string): IProviderStatus | undefined;

	/**
	 * Get all available models across all providers
	 */
	getAvailableModels(): readonly IModelInfo[];

	/**
	 * Generate a completion using the active provider
	 */
	complete(
		options: ICompletionOptions,
		token?: CancellationToken
	): Promise<ICompletionResponse>;

	/**
	 * Generate a streaming completion using the active provider
	 */
	streamComplete(
		options: ICompletionOptions,
		token?: CancellationToken
	): AsyncIterable<IStreamChunk>;

	/**
	 * Generate a chat response using the active provider
	 */
	chat(
		options: IChatOptions,
		token?: CancellationToken
	): Promise<IChatResponse>;

	/**
	 * Generate a streaming chat response using the active provider
	 */
	streamChat(
		options: IChatOptions,
		token?: CancellationToken
	): AsyncIterable<IStreamChunk>;

	/**
	 * Generate embeddings for text
	 */
	generateEmbedding(
		text: string,
		providerId?: string,
		token?: CancellationToken
	): Promise<number[]>;

	/**
	 * Complete code in editor context (convenience method)
	 */
	completeInEditor(
		context: ICodeContext,
		options?: Partial<ICompletionOptions>,
		token?: CancellationToken
	): Promise<ICompletionResponse>;

	/**
	 * Chat with code context (convenience method)
	 */
	chatWithContext(
		message: string,
		context: ICodeContext,
		options?: Partial<IChatOptions>,
		token?: CancellationToken
	): Promise<IChatResponse>;

	/**
	 * Check if AI service is ready to use
	 */
	isReady(): boolean;

	/**
	 * Check if a specific provider is configured
	 */
	isProviderConfigured(providerId: string): boolean;
}

