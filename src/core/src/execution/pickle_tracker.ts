import type { Pickle } from '@cucumber/messages';

/**
 * PickleTracker monitors the lifecycle of test scenarios (Pickles) during parallel execution.
 * It tracks which scenarios are currently running and which have completed, enabling
 * intelligent scheduling decisions based on execution history.
 * 
 * This is particularly useful for implementing rules that depend on knowing which tests
 * have already finished (e.g., sequential execution, dependencies between tests).
 */
export class PickleTracker {
    private previousRunning: Set<string> = new Set();
    private runned: Set<string> = new Set();
    private running: Set<string> = new Set();
    private pickleMap: Map<string, Pickle> = new Map();

    /**
     * Call this method with the current list of running pickles reported by Cucumber.
     * It will automatically detect which pickles have finished since the last call
     * and update the internal state accordingly.
     * 
     * @param currentRunning - Array of pickles currently being executed
     */
    registerRunning(currentRunning: Pickle[]): void {
        const currentRunningIds = new Set<string>();

        for (const pickle of currentRunning) {
            const id = this.getPickleId(pickle);
            currentRunningIds.add(id);
            this.pickleMap.set(id, pickle);
        }

        // Detect finished pickles: were running before but not anymore
        for (const previousId of this.previousRunning) {
            if (!currentRunningIds.has(previousId)) {
                this.runned.add(previousId);
            }
        }

        // Rebuild running from the current snapshot (not accumulated)
        this.running = new Set(currentRunningIds);

        this.previousRunning = currentRunningIds;
    }

    /**
     * Returns the list of pickles that have already finished execution.
     * 
     * @returns Array of completed pickles
     */
    getRunned(): Pickle[] {
        return Array.from(this.runned).map(id => this.pickleMap.get(id)!).filter(Boolean);
    }

    /**
     * Returns the list of pickles currently running.
     * 
     * @returns Array of running pickles
     */
    getRunning(): Pickle[] {
        return Array.from(this.running).map(id => this.pickleMap.get(id)!).filter(Boolean);
    }

    /**
     * Checks if a specific pickle has already finished execution.
     * 
     * @param pickle - The pickle to check
     * @returns true if the pickle has finished, false otherwise
     */
    hasRunned(pickle: Pickle): boolean {
        return this.runned.has(this.getPickleId(pickle));
    }

    /**
     * Checks if a specific pickle is currently running.
     * 
     * @param pickle - The pickle to check
     * @returns true if the pickle is running, false otherwise
     */
    isRunning(pickle: Pickle): boolean {
        return this.running.has(this.getPickleId(pickle));
    }

    /**
     * Returns the total count of finished pickles.
     * 
     * @returns Number of completed pickles
     */
    getRunnedCount(): number {
        return this.runned.size;
    }

    /**
     * Returns the total count of currently running pickles.
     * 
     * @returns Number of running pickles
     */
    getRunningCount(): number {
        return this.running.size;
    }

    /**
     * Resets the tracker to its initial state.
     * Useful for testing or restarting execution tracking.
     */
    reset(): void {
        this.previousRunning.clear();
        this.runned.clear();
        this.running.clear();
        this.pickleMap.clear();
    }

    /**
     * Generates a unique identifier for a pickle.
     * Uses the pickle's ID if available, otherwise falls back to URI + astNodeIds.
     * 
     * @param pickle - The pickle to identify
     * @returns Unique identifier string
     */
    private getPickleId(pickle: Pickle): string {
        if (pickle.id) {
            return pickle.id;
        }
        // Fallback: use URI and astNodeIds to create a unique identifier
        const nodeIds = pickle.astNodeIds?.join(',') || '';
        return `${pickle.uri}:${nodeIds}`;
    }
}
