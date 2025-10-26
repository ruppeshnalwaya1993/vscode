/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';

/**
 * Token usage information for AI requests
 */
export interface ITokenUsage {
	readonly promptTokens: number;
	readonly completionTokens: number;
	readonly totalTokens: number;
}

/**
 * AI model information
 */
export interface IModelInfo {
	readonly id: string;
	readonly name: string;
	readonly provider: string;
	readonly contextWindow: number;
	readonly maxOutputTokens: number;
	readonly supportsStreaming: boolean;
	readonly supportsFunctions: boolean;
}

/**
 * Chat message for AI conversations
 */
export interface IChatMessage {
	readonly role: 'system' | 'user' | 'assistant' | 'function';
	readonly content: string;
	readonly name?: string;
	readonly functionCall?: {
		readonly name: string;
		readonly arguments: string;
	};
}

/**
 * Code context for AI requests
 */
export interface ICodeContext {
	readonly currentFile?: {
		readonly uri: URI;
		readonly content: string;
		readonly language: string;
		readonly selection?: {
			readonly text: string;
			readonly startLine: number;
			readonly endLine: number;
			readonly startColumn: number;
			readonly endColumn: number;
		};
	};
	readonly openFiles?: Array<{
		readonly uri: URI;
		readonly content: string;
		readonly language: string;
	}>;
	readonly recentFiles?: URI[];
	readonly workspaceInfo?: {
		readonly rootUri: URI;
		readonly name: string;
	};
	readonly gitInfo?: {
		readonly branch: string;
		readonly hasChanges: boolean;
	};
}

/**
 * Workspace context for broader AI understanding
 */
export interface IWorkspaceContext {
	readonly rootUri: URI;
	readonly name: string;
	readonly fileCount: number;
	readonly relevantFiles: Array<{
		readonly uri: URI;
		readonly relevance: number;
	}>;
	readonly dependencies?: Array<{
		readonly name: string;
		readonly version: string;
	}>;
}

/**
 * Code chunk for indexing and search
 */
export interface ICodeChunk {
	readonly content: string;
	readonly startLine: number;
	readonly endLine: number;
	readonly type: 'function' | 'class' | 'method' | 'block' | 'file';
	readonly name?: string;
	readonly signature?: string;
}

/**
 * Search result from semantic search
 */
export interface ISearchResult {
	readonly uri: URI;
	readonly chunk: ICodeChunk;
	readonly score: number;
	readonly context: string;
}

/**
 * Completion request options
 */
export interface ICompletionOptions {
	readonly prompt?: string;
	readonly context?: ICodeContext;
	readonly maxTokens?: number;
	readonly temperature?: number;
	readonly stopSequences?: string[];
	readonly model?: string;
	readonly provider?: string;
}

/**
 * Completion response from AI
 */
export interface ICompletionResponse {
	readonly text: string;
	readonly finishReason: 'stop' | 'length' | 'error';
	readonly usage: ITokenUsage;
	readonly model: string;
	readonly cached?: boolean;
}

/**
 * Chat request options
 */
export interface IChatOptions {
	readonly messages: IChatMessage[];
	readonly context?: ICodeContext;
	readonly maxTokens?: number;
	readonly temperature?: number;
	readonly model?: string;
	readonly provider?: string;
	readonly stream?: boolean;
}

/**
 * Chat response from AI
 */
export interface IChatResponse {
	readonly message: IChatMessage;
	readonly finishReason: 'stop' | 'length' | 'error';
	readonly usage: ITokenUsage;
	readonly model: string;
}

/**
 * Streaming chunk for real-time responses
 */
export interface IStreamChunk {
	readonly content: string;
	readonly done: boolean;
	readonly usage?: ITokenUsage;
}

/**
 * Cache entry for AI responses
 */
export interface ICacheEntry<T> {
	readonly value: T;
	readonly timestamp: number;
	readonly ttl: number;
	readonly context?: ICodeContext;
}

/**
 * Cache statistics
 */
export interface ICacheStats {
	readonly size: number;
	readonly hits: number;
	readonly misses: number;
	readonly hitRate: number;
	readonly memoryUsage: number;
}

/**
 * Index status information
 */
export interface IIndexStatus {
	readonly isIndexing: boolean;
	readonly totalFiles: number;
	readonly indexedFiles: number;
	readonly lastIndexed?: Date;
	readonly progress: number;
}

/**
 * Search options for semantic search
 */
export interface ISearchOptions {
	readonly maxResults?: number;
	readonly threshold?: number;
	readonly fileTypes?: string[];
	readonly excludePaths?: string[];
}

/**
 * Provider configuration
 */
export interface IProviderConfig {
	readonly id: string;
	readonly name: string;
	readonly apiKey?: string;
	readonly baseUrl?: string;
	readonly models: string[];
	readonly defaultModel: string;
	readonly enabled: boolean;
}

/**
 * RisingBird configuration
 */
export interface IRisingBirdConfig {
	readonly enabled: boolean;
	readonly activeProvider: string;
	readonly providers: Record<string, IProviderConfig>;
	readonly autocomplete: {
		readonly enabled: boolean;
		readonly multiline: boolean;
		readonly debounceMs: number;
		readonly maxTokens: number;
		readonly temperature: number;
	};
	readonly chat: {
		readonly enabled: boolean;
		readonly persistHistory: boolean;
		readonly maxHistorySize: number;
	};
	readonly privacy: {
		readonly mode: 'cloud' | 'local' | 'hybrid';
		readonly excludePatterns: string[];
		readonly detectSensitiveData: boolean;
	};
	readonly indexing: {
		readonly enabled: boolean;
		readonly autoIndex: boolean;
		readonly excludePatterns: string[];
	};
	readonly cache: {
		readonly enabled: boolean;
		readonly ttlSeconds: number;
		readonly maxSize: number;
	};
}

/**
 * Error types for RisingBird
 */
export enum RisingBirdErrorType {
	ProviderError = 'ProviderError',
	AuthenticationError = 'AuthenticationError',
	RateLimitError = 'RateLimitError',
	NetworkError = 'NetworkError',
	InvalidRequestError = 'InvalidRequestError',
	ContextTooLargeError = 'ContextTooLargeError',
	CacheError = 'CacheError',
	IndexingError = 'IndexingError',
	UnknownError = 'UnknownError'
}

/**
 * RisingBird error class
 */
export class RisingBirdError extends Error {
	constructor(
		message: string,
		public readonly type: RisingBirdErrorType,
		public readonly details?: unknown
	) {
		super(message);
		this.name = 'RisingBirdError';
	}
}

