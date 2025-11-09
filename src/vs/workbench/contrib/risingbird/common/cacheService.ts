/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { RisingBirdConfigKeys, RisingBirdDefaults } from './constants.js';
import { ICacheEntry, ICacheStats } from './types.js';

export const ICacheService = createDecorator<ICacheService>('cacheService');

/**
 * Cache service for AI responses
 */
export interface ICacheService {
	readonly _serviceBrand: undefined;

	/**
	 * Get a cached value
	 */
	get<T>(key: string): Promise<T | undefined>;

	/**
	 * Set a cached value
	 */
	set<T>(key: string, value: T, ttl?: number): Promise<void>;

	/**
	 * Check if a key exists in cache
	 */
	has(key: string): Promise<boolean>;

	/**
	 * Delete a cached value
	 */
	delete(key: string): Promise<void>;

	/**
	 * Clear all cached values
	 */
	clear(): Promise<void>;

	/**
	 * Get cache statistics
	 */
	getStats(): ICacheStats;

	/**
	 * Reset statistics
	 */
	resetStats(): void;
}

/**
 * Simple in-memory cache implementation with LRU eviction
 */
export class CacheService extends Disposable implements ICacheService {
	declare readonly _serviceBrand: undefined;

	private readonly _cache = new Map<string, ICacheEntry<unknown>>();
	private readonly _accessOrder = new Map<string, number>();
	private _accessCounter = 0;

	private _hits = 0;
	private _misses = 0;
	private _maxSize!: number;
	private _defaultTTL!: number;
	private _enabled!: boolean;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@ILogService private readonly logService: ILogService
	) {
		super();

		this._loadConfiguration();

		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(RisingBirdConfigKeys.CacheEnabled) ||
				e.affectsConfiguration(RisingBirdConfigKeys.CacheTTL) ||
				e.affectsConfiguration(RisingBirdConfigKeys.CacheMaxSize)) {
				this._loadConfiguration();
			}
		}));

		// Cleanup expired entries periodically
		const cleanupInterval = setInterval(() => {
			this._cleanupExpired();
		}, 60000); // Every minute

		this._register({
			dispose: () => clearInterval(cleanupInterval)
		});
	}

	async get<T>(key: string): Promise<T | undefined> {
		if (!this._enabled) {
			return undefined;
		}

		const entry = this._cache.get(key);

		if (!entry) {
			this._misses++;
			return undefined;
		}

		// Check if expired
		const now = Date.now();
		if (now - entry.timestamp > entry.ttl * 1000) {
			this._cache.delete(key);
			this._accessOrder.delete(key);
			this._misses++;
			return undefined;
		}

		// Update access order
		this._accessOrder.set(key, this._accessCounter++);
		this._hits++;

		return entry.value as T;
	}

	async set<T>(key: string, value: T, ttl?: number): Promise<void> {
		if (!this._enabled) {
			return;
		}

		// Evict if at capacity
		if (this._cache.size >= this._maxSize) {
			this._evictLRU();
		}

		const entry: ICacheEntry<T> = {
			value,
			timestamp: Date.now(),
			ttl: ttl ?? this._defaultTTL
		};

		this._cache.set(key, entry);
		this._accessOrder.set(key, this._accessCounter++);
	}

	async has(key: string): Promise<boolean> {
		if (!this._enabled) {
			return false;
		}

		const entry = this._cache.get(key);
		if (!entry) {
			return false;
		}

		// Check if expired
		const now = Date.now();
		if (now - entry.timestamp > entry.ttl * 1000) {
			this._cache.delete(key);
			this._accessOrder.delete(key);
			return false;
		}

		return true;
	}

	async delete(key: string): Promise<void> {
		this._cache.delete(key);
		this._accessOrder.delete(key);
	}

	async clear(): Promise<void> {
		this._cache.clear();
		this._accessOrder.clear();
		this._accessCounter = 0;
		this.logService.info('Cache cleared');
	}

	getStats(): ICacheStats {
		const total = this._hits + this._misses;
		const hitRate = total > 0 ? this._hits / total : 0;

		// Estimate memory usage (rough)
		let memoryUsage = 0;
		for (const entry of this._cache.values()) {
			memoryUsage += JSON.stringify(entry.value).length;
		}

		return {
			size: this._cache.size,
			hits: this._hits,
			misses: this._misses,
			hitRate,
			memoryUsage
		};
	}

	resetStats(): void {
		this._hits = 0;
		this._misses = 0;
	}

	private _loadConfiguration(): void {
		this._enabled = this.configurationService.getValue<boolean>(
			RisingBirdConfigKeys.CacheEnabled
		) ?? true;

		this._defaultTTL = this.configurationService.getValue<number>(
			RisingBirdConfigKeys.CacheTTL
		) ?? RisingBirdDefaults.CACHE_TTL_SECONDS;

		this._maxSize = this.configurationService.getValue<number>(
			RisingBirdConfigKeys.CacheMaxSize
		) ?? RisingBirdDefaults.CACHE_MAX_SIZE;

		if (!this._enabled) {
			this.clear();
		}
	}

	private _evictLRU(): void {
		// Find least recently used entry
		let lruKey: string | undefined;
		let lruAccess = Infinity;

		for (const [key, access] of this._accessOrder.entries()) {
			if (access < lruAccess) {
				lruAccess = access;
				lruKey = key;
			}
		}

		if (lruKey) {
			this._cache.delete(lruKey);
			this._accessOrder.delete(lruKey);
		}
	}

	private _cleanupExpired(): void {
		const now = Date.now();
		const keysToDelete: string[] = [];

		for (const [key, entry] of this._cache.entries()) {
			if (now - entry.timestamp > entry.ttl * 1000) {
				keysToDelete.push(key);
			}
		}

		for (const key of keysToDelete) {
			this._cache.delete(key);
			this._accessOrder.delete(key);
		}

		if (keysToDelete.length > 0) {
			this.logService.trace(`Cleaned up ${keysToDelete.length} expired cache entries`);
		}
	}

	override dispose(): void {
		this._cache.clear();
		this._accessOrder.clear();
		super.dispose();
	}
}

