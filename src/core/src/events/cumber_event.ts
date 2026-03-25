import { UUID } from "crypto";
import {v4 as uuidv4} from 'uuid';

/**
 * Base event with automatic timestamp capture
 * 
 * When T is void: no data property, constructor takes no arguments
 * When T is not void: data property is mandatory, constructor requires data
 * 
 * @example
 * // Simple event (no data)
 * class UserLoggedOut extends CumberEvent {
 *   constructor(public userId: string) {
 *     super();
 *   }
 * }
 * 
 * // Event with data payload
 * class OrderCreated extends CumberEvent<{ orderId: string; amount: number }> {
 *   constructor(data: { orderId: string; amount: number }) {
 *     super(data);
 *   }
 * }
 */
export class CumberEvent<T = void> {
    /**
     * Timestamp when the event was created
     */
    public readonly timestamp: Date;
    public readonly id: string;

    /**
     * Data payload (only present when T is not void)
     */
    public readonly data!: T extends void ? never : T;

    constructor(...args: T extends void ? [] : [T]) {
        this.timestamp = new Date();
        this.id = uuidv4();

        if (args.length > 0) {
            (this.data as any) = args[0];
        }
    }
}
