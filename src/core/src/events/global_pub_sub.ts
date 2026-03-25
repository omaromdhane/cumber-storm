/**
 * CumberStorm Typed Emitter
 * Pre-configured with CumberStorm event types
 */
import { TypedPubSub } from '../common/events';
import { CumberStormEventMap } from './event_type_map';


/**
 * Global CumberStorm event emitter with full type safety
 * 
 * @example
 * // Subscribe
 * cumberStormEmitter.on(CumberStormEventType.WORKER_STARTED, (event) => {
 *   console.log(event.workerId); // Fully typed!
 * });
 * 
 * // Emit
 * cumberStormEmitter.emit(CumberStormEventType.WORKER_STARTED, {
 *   timestamp: new Date(),
 *   workerId: 'worker-1'
 * });
 */
export const globalPubsub = new TypedPubSub<CumberStormEventMap>();
