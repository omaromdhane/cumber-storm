/**
 * Event Collector
 * 
 * Collects events from a TypedPubSub emitter and stores them for later retrieval.
 * Useful for testing, debugging, and event replay.
 */

import { EventCollector, TypedPubSub } from '../common/events';
import { Disposable, IDisposable } from '../common/lifecycle';
import { CumberStormEventMap } from './event_type_map';


/**
 * Create a simple event collector with default options
 */
export function createEventCollector<TEventMap extends Record<string, any>>(
    emitter: TypedPubSub<TEventMap>,
    options?: {
        maxEvents?: number;
        filter?: <K extends keyof TEventMap>(event: K, data: TEventMap[K]) => boolean;
    }
): EventCollector<TEventMap> {
    return new EventCollector(emitter, options);
}

/**
 * Global CumberStorm event collector instance
 * Automatically collects all CumberStorm events
 * 
 * @example
 * import { cumberStormCollector } from './events/event_collector';
 * 
 * // Events are automatically collected
 * // ...
 * 
 * // Get all collected events
 * const events = cumberStormCollector.getAll();
 * 
 * // Get as key-value pairs
 * const pairs = cumberStormCollector.getAsKeyValuePairs();
 * 
 * // Clear collected events
 * cumberStormCollector.clear();
 */
import { globalPubsub } from './global_pub_sub';

export const globalEventCollector = new EventCollector<CumberStormEventMap>(globalPubsub);
