export class IdGenerator {
    private static counter = 0;
    private static readonly lock = { locked: false };

    /**
     * Thread-safe lock mechanism
     */
    private static acquireLock(): void {
        while (this.lock.locked) {
            // Busy wait - in Node.js single-threaded event loop, this is safe
        }
        this.lock.locked = true;
    }

    /**
     * Release lock
     */
    private static releaseLock(): void {
        this.lock.locked = false;
    }

    /**
     * Generates a unique numeric ID
     * Thread-safe counter-based ID generation
     * @returns Unique numeric ID
     */
    public static generate(prefix?: string): string {
        this.acquireLock();
        try {
            let newId = String(++this.counter);
            if(prefix){
                newId = prefix + '_' + newId;
            }
            return newId;
        } finally {
            this.releaseLock();
        }
    }

    /**
     * Gets the current counter value without incrementing
     * @returns Current counter value
     */
    public static current(): string {
        return String(this.counter);
    }

    /**
     * Resets the counter (useful for testing)
     */
    public static reset(): void {
        this.acquireLock();
        try {
            this.counter = 0;
        } finally {
            this.releaseLock();
        }
    }
}
