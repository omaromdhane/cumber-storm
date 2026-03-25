/**
 * Event system inspired by VSCode's event pattern
 */

import { Disposable, IDisposable } from './lifecycle';

export interface Event<T> {
    (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}

interface Listener<T> {
    fn: (e: T) => any;
    thisArgs?: any;
}

/**
 * Synchronous event emitter.
 */
export class Emitter<T> implements IDisposable {
    private listeners: Listener<T>[] = [];
    private disposed: boolean = false;

    get event(): Event<T> {
        return (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable => {
            if (this.disposed) {
                throw new Error('Cannot add listener to disposed emitter');
            }

            const listenerObj: Listener<T> = { fn: listener, thisArgs };
            this.listeners.push(listenerObj);

            const disposable: IDisposable = {
                dispose: () => {
                    const index = this.listeners.indexOf(listenerObj);
                    if (index > -1) {
                        this.listeners.splice(index, 1);
                    }
                }
            };

            if (disposables) {
                disposables.push(disposable);
            }

            return disposable;
        };
    }

    fire(event: T): void {
        if (this.disposed) {
            return;
        }

        for (const listener of this.listeners.slice()) {
            try {
                listener.fn.call(listener.thisArgs, event);
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        }
    }

    dispose(): void {
        this.listeners = [];
        this.disposed = true;
    }

    hasListeners(): boolean {
        return this.listeners.length > 0;
    }
}

export class TypedPubSub<TEventMap extends Record<string, any>> {
    private emitters = new Map<keyof TEventMap, Emitter<any>>();
    private wildcardEmitter = new Emitter<{ event: keyof TEventMap; data: any }>();

    /**
     * Subscribe to an event
     */
    on<K extends keyof TEventMap>(
        event: K,
        handler: (data: TEventMap[K]) => void,
        thisArg?: any
    ): IDisposable {
        let emitter = this.emitters.get(event);
        
        if (!emitter) {
            emitter = new Emitter<TEventMap[K]>();
            this.emitters.set(event, emitter);
        }

        return emitter.event(handler, thisArg);
    }

    /**
     * Subscribe to all events (wildcard listener)
     * 
     * @example
     * emitter.onAll((event, data) => {
     *   console.log(`Event ${String(event)} fired with:`, data);
     * });
     */
    onAll(
        handler: <K extends keyof TEventMap>(event: K, data: TEventMap[K]) => void,
        thisArg?: any
    ): IDisposable {
        return this.wildcardEmitter.event((payload) => {
            handler.call(thisArg, payload.event, payload.data);
        });
    }

    /**
     * Emit an event
     */
    emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void {
        // Fire to specific event listeners
        const emitter = this.emitters.get(event);
        if (emitter) {
            emitter.fire(data);
        }

        // Fire to wildcard listeners
        this.wildcardEmitter.fire({ event, data });
    }

    /**
     * Check if event has listeners
     */
    hasListeners<K extends keyof TEventMap>(event: K): boolean {
        const emitter = this.emitters.get(event);
        return emitter ? emitter.hasListeners() : false;
    }

    /**
     * Check if there are any wildcard listeners
     */
    hasWildcardListeners(): boolean {
        return this.wildcardEmitter.hasListeners();
    }

    /**
     * Dispose all emitters
     */
    dispose(): void {
        for (const emitter of this.emitters.values()) {
            emitter.dispose();
        }
        this.emitters.clear();
        this.wildcardEmitter.dispose();
    }
}

export interface CollectedEvent<K = any, V = any> {
    event: K;
    data: V;
    timestamp: Date;
    index: number;
}

/**
 * Collects events from a TypedPubSub emitter
 * 
 * @example
 * const collector = new EventCollector(cumberStormEmitter);
 * 
 * // Events are automatically collected
 * emitter.emit('user.login', { userId: '123' });
 * emitter.emit('user.logout', { userId: '123' });
 * 
 * // Get all collected events
 * const events = collector.getAll();
 * // [
 * //   { event: 'user.login', data: { userId: '123' }, timestamp: ..., index: 0 },
 * //   { event: 'user.logout', data: { userId: '123' }, timestamp: ..., index: 1 }
 * // ]
 * 
 * // Clear collected events
 * collector.clear();
 * 
 * // Stop collecting
 * collector.dispose();
 */
export class EventCollector<TEventMap extends Record<string, any>> extends Disposable {
    private events: CollectedEvent<keyof TEventMap, any>[] = [];
    private eventIndex = 0;
    private subscription?: IDisposable;

    constructor(
        private emitter: TypedPubSub<TEventMap>,
        private options: {
            maxEvents?: number;
            filter?: <K extends keyof TEventMap>(event: K, data: TEventMap[K]) => boolean;
        } = {}
    ) {
        super();
        this.startCollecting();
    }

    private startCollecting(): void {
        this.subscription = this.emitter.onAll((event, data) => {
            // Apply filter if provided
            if (this.options.filter && !this.options.filter(event, data)) {
                return;
            }

            const collectedEvent: CollectedEvent<keyof TEventMap, any> = {
                event,
                data,
                timestamp: new Date(),
                index: this.eventIndex++
            };

            this.events.push(collectedEvent);

            // Enforce max events limit
            if (this.options.maxEvents && this.events.length > this.options.maxEvents) {
                this.events.shift(); // Remove oldest event
            }
        });

        this._register(this.subscription);
    }

    /**
     * Get all collected events
     */
    getAll(): CollectedEvent<keyof TEventMap, any>[] {
        return [...this.events];
    }

    /**
     * Get events as key-value pairs
     */
    getAsKeyValuePairs(): Array<{ key: keyof TEventMap; value: any; timestamp: Date; index: number }> {
        return this.events.map(e => ({
            key: e.event,
            value: e.data,
            timestamp: e.timestamp,
            index: e.index
        }));
    }

    /**
     * Get events of a specific type
     */
    getByEvent<K extends keyof TEventMap>(event: K): CollectedEvent<keyof TEventMap, any>[] {
        return this.events.filter(e => e.event === event);
    }

    /**
     * Get the last N events
     */
    getLast(count: number): CollectedEvent<keyof TEventMap, any>[] {
        return this.events.slice(-count);
    }

    /**
     * Get the first N events
     */
    getFirst(count: number): CollectedEvent<keyof TEventMap, any>[] {
        return this.events.slice(0, count);
    }

    /**
     * Get events within a time range
     */
    getByTimeRange(start: Date, end: Date): CollectedEvent<keyof TEventMap, any>[] {
        return this.events.filter(e => 
            e.timestamp >= start && e.timestamp <= end
        );
    }

    /**
     * Get count of collected events
     */
    getCount(): number {
        return this.events.length;
    }

    /**
     * Get count of events by type
     */
    getCountByEvent(): Map<keyof TEventMap, number> {
        const counts = new Map<keyof TEventMap, number>();
        
        for (const event of this.events) {
            const current = counts.get(event.event) || 0;
            counts.set(event.event, current + 1);
        }
        
        return counts;
    }

    /**
     * Check if any events have been collected
     */
    hasEvents(): boolean {
        return this.events.length > 0;
    }

    /**
     * Check if a specific event type has been collected
     */
    hasEvent<K extends keyof TEventMap>(event: K): boolean {
        return this.events.some(e => e.event === event);
    }

    /**
     * Clear all collected events
     */
    clear(): void {
        this.events = [];
        this.eventIndex = 0;
    }

    /**
     * Export events as JSON
     */
    toJSON(): string {
        return JSON.stringify(this.events, null, 2);
    }

    /**
     * Export events as CSV
     */
    toCSV(): string {
        if (this.events.length === 0) {
            return 'index,event,timestamp,data\n';
        }

        const header = 'index,event,timestamp,data\n';
        const rows = this.events.map(e => 
            `${e.index},"${String(e.event)}","${e.timestamp.toISOString()}","${JSON.stringify(e.data).replace(/"/g, '""')}"`
        ).join('\n');

        return header + rows;
    }

    /**
     * Stop collecting events and dispose
     */
    override dispose(): void {
        super.dispose();
    }
}
