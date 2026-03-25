import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { Emitter, TypedPubSub, EventCollector } from './events';

describe('Emitter', () => {
    it('should emit and receive events', () => {
        const emitter = new Emitter<string>();
        let received: string | undefined;

        emitter.event((value) => {
            received = value;
        });

        emitter.fire('test');
        expect(received).to.equal('test');
    });

    it('should support multiple listeners', () => {
        const emitter = new Emitter<number>();
        let count = 0;

        emitter.event(() => count++);
        emitter.event(() => count++);
        emitter.event(() => count++);

        emitter.fire(42);
        expect(count).to.equal(3);
    });

    it('should dispose listeners', () => {
        const emitter = new Emitter<string>();
        let received: string | undefined;

        const disposable = emitter.event((value) => {
            received = value;
        });

        emitter.fire('first');
        expect(received).to.equal('first');

        disposable.dispose();
        received = undefined;

        emitter.fire('second');
        expect(received).to.be.undefined;
    });

    it('should support thisArgs', () => {
        const emitter = new Emitter<string>();
        const context = { value: '' };

        emitter.event(function(this: any, value: string) {
            this.value = value;
        }, context);

        emitter.fire('test');
        expect(context.value).to.equal('test');
    });

    it('should add disposables to array', () => {
        const emitter = new Emitter<string>();
        const disposables: any[] = [];

        emitter.event(() => {}, undefined, disposables);
        emitter.event(() => {}, undefined, disposables);

        expect(disposables).to.have.lengthOf(2);
    });

    it('should dispose emitter', () => {
        const emitter = new Emitter<string>();
        let count = 0;

        emitter.event(() => count++);
        emitter.fire('test');
        expect(count).to.equal(1);

        emitter.dispose();
        emitter.fire('test2');
        expect(count).to.equal(1); // Should not increment
    });

    it('should check if has listeners', () => {
        const emitter = new Emitter<string>();
        expect(emitter.hasListeners()).to.be.false;

        const disposable = emitter.event(() => {});
        expect(emitter.hasListeners()).to.be.true;

        disposable.dispose();
        expect(emitter.hasListeners()).to.be.false;
    });

    it('should handle errors in listeners gracefully', () => {
        const emitter = new Emitter<string>();
        let received: string | undefined;

        emitter.event(() => {
            throw new Error('Test error');
        });

        emitter.event((value) => {
            received = value;
        });

        emitter.fire('test');
        expect(received).to.equal('test'); // Second listener should still execute
    });

    it('should throw when adding listener after dispose', () => {
        const emitter = new Emitter<string>();

        emitter.dispose();

        expect(() => {
            emitter.event(() => {});
        }).to.throw('Cannot add listener to disposed emitter');
    });

    it('should not fire events after dispose', () => {
        const emitter = new Emitter<string>();
        let count = 0;

        emitter.event(() => count++);
        emitter.fire('test1');
        expect(count).to.equal(1);

        emitter.dispose();
        emitter.fire('test2');
        emitter.fire('test3');
        expect(count).to.equal(1);
    });

    it('should clear all listeners on dispose', () => {
        const emitter = new Emitter<string>();

        emitter.event(() => {});
        emitter.event(() => {});
        emitter.event(() => {});

        expect(emitter.hasListeners()).to.be.true;

        emitter.dispose();
        expect(emitter.hasListeners()).to.be.false;
    });
});

describe('TypedPubSub', () => {
    interface TestEvents {
        'user.login': { userId: string; username: string };
        'user.logout': { userId: string };
        'order.created': { orderId: string; amount: number };
    }

    let pubsub: TypedPubSub<TestEvents>;

    beforeEach(() => {
        pubsub = new TypedPubSub<TestEvents>();
    });

    describe('on and emit', () => {
        it('should emit and receive typed events', () => {
            let received: { userId: string; username: string } | undefined;

            pubsub.on('user.login', (data) => {
                received = data;
            });

            pubsub.emit('user.login', { userId: '123', username: 'alice' });

            expect(received).to.deep.equal({ userId: '123', username: 'alice' });
        });

        it('should support multiple event types', () => {
            const received: string[] = [];

            pubsub.on('user.login', (data) => {
                received.push(`login:${data.username}`);
            });

            pubsub.on('user.logout', (data) => {
                received.push(`logout:${data.userId}`);
            });

            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });

            expect(received).to.deep.equal(['login:alice', 'logout:1']);
        });

        it('should support multiple listeners per event', () => {
            let count = 0;

            pubsub.on('user.login', () => count++);
            pubsub.on('user.login', () => count++);
            pubsub.on('user.login', () => count++);

            pubsub.emit('user.login', { userId: '1', username: 'alice' });

            expect(count).to.equal(3);
        });
    });

    describe('onAll', () => {
        it('should receive all events', () => {
            const received: string[] = [];

            pubsub.onAll((event) => {
                received.push(String(event));
            });

            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });
            pubsub.emit('order.created', { orderId: 'O1', amount: 100 });

            expect(received).to.deep.equal(['user.login', 'user.logout', 'order.created']);
        });

        it('should receive both specific and wildcard events', () => {
            let specificCount = 0;
            let wildcardCount = 0;

            pubsub.on('user.login', () => specificCount++);
            pubsub.onAll(() => wildcardCount++);

            pubsub.emit('user.login', { userId: '1', username: 'alice' });

            expect(specificCount).to.equal(1);
            expect(wildcardCount).to.equal(1);
        });
    });

    describe('hasListeners', () => {
        it('should return false when no listeners', () => {
            expect(pubsub.hasListeners('user.login')).to.be.false;
        });

        it('should return true when listeners exist', () => {
            pubsub.on('user.login', () => {});
            expect(pubsub.hasListeners('user.login')).to.be.true;
        });

        it('should return false after disposing listener', () => {
            const disposable = pubsub.on('user.login', () => {});
            expect(pubsub.hasListeners('user.login')).to.be.true;

            disposable.dispose();
            expect(pubsub.hasListeners('user.login')).to.be.false;
        });
    });

    describe('hasWildcardListeners', () => {
        it('should return false when no wildcard listeners', () => {
            expect(pubsub.hasWildcardListeners()).to.be.false;
        });

        it('should return true when wildcard listeners exist', () => {
            pubsub.onAll(() => {});
            expect(pubsub.hasWildcardListeners()).to.be.true;
        });
    });

    describe('dispose', () => {
        it('should dispose all listeners', () => {
            let count = 0;

            pubsub.on('user.login', () => count++);
            pubsub.on('user.logout', () => count++);
            pubsub.onAll(() => count++);

            // Emit once - should trigger 2 listeners (user.login + wildcard)
            pubsub.emit('user.login', { userId: '2', username: 'bob' });
            expect(count).to.equal(2);

            // Dispose all listeners
            pubsub.dispose();

            // Emit again - should NOT trigger any listeners
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });

            // Count should still be 2 (not incremented after dispose)
            expect(count).to.equal(2);
        });
    });
});

describe('EventCollector', () => {
    interface TestEvents {
        'user.login': { userId: string; username: string };
        'user.logout': { userId: string };
        'order.created': { orderId: string; amount: number };
    }

    let pubsub: TypedPubSub<TestEvents>;
    let collector: EventCollector<TestEvents>;

    beforeEach(() => {
        pubsub = new TypedPubSub<TestEvents>();
        collector = new EventCollector(pubsub);
    });

    afterEach(() => {
        collector.dispose();
    });

    describe('collection', () => {
        it('should collect emitted events', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });

            const events = collector.getAll();
            expect(events).to.have.lengthOf(2);
        });

        it('should include timestamp and index', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });

            const events = collector.getAll();
            expect(events[0].timestamp).to.be.instanceOf(Date);
            expect(events[0].index).to.equal(0);
        });
    });

    describe('getAsKeyValuePairs', () => {
        it('should return events as key-value pairs', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });

            const pairs = collector.getAsKeyValuePairs();
            expect(pairs).to.have.lengthOf(2);
            expect(pairs[0].key).to.equal('user.login');
            expect(pairs[0].value).to.deep.equal({ userId: '1', username: 'alice' });
        });
    });

    describe('getByEvent', () => {
        it('should filter events by type', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });
            pubsub.emit('user.login', { userId: '2', username: 'bob' });

            const loginEvents = collector.getByEvent('user.login');
            expect(loginEvents).to.have.lengthOf(2);
        });
    });

    describe('getCount', () => {
        it('should return total count', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });

            expect(collector.getCount()).to.equal(2);
        });

        it('should return count by event type', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });
            pubsub.emit('user.login', { userId: '2', username: 'bob' });

            const counts = collector.getCountByEvent();
            expect(counts.get('user.login')).to.equal(2);
            expect(counts.get('user.logout')).to.equal(1);
        });
    });

    describe('clear', () => {
        it('should clear all collected events', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });

            expect(collector.getCount()).to.equal(2);

            collector.clear();

            expect(collector.getCount()).to.equal(0);
        });
    });

    describe('maxEvents option', () => {
        it('should limit collected events', () => {
            collector.dispose();
            collector = new EventCollector(pubsub, { maxEvents: 2 });

            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });
            pubsub.emit('user.login', { userId: '2', username: 'bob' });

            expect(collector.getCount()).to.equal(2);
        });
    });

    describe('export', () => {
        it('should export as JSON', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });

            const json = collector.toJSON();
            const parsed = JSON.parse(json);

            expect(parsed).to.be.an('array');
            expect(parsed).to.have.lengthOf(1);
        });

        it('should export as CSV', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });

            const csv = collector.toCSV();

            expect(csv).to.include('index,event,timestamp,data');
            expect(csv).to.include('user.login');
        });
    });

    describe('dispose', () => {
        it('should stop collecting events after dispose', () => {
            // Emit some events before dispose
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            pubsub.emit('user.logout', { userId: '1' });

            expect(collector.getCount()).to.equal(2);

            // Dispose the collector
            collector.dispose();

            // Emit more events after dispose
            pubsub.emit('user.login', { userId: '2', username: 'bob' });
            pubsub.emit('order.created', { orderId: 'O1', amount: 100 });

            // Count should still be 2 (not collecting after dispose)
            expect(collector.getCount()).to.equal(2);
        });

        it('should not collect events after dispose even if cleared', () => {
            pubsub.emit('user.login', { userId: '1', username: 'alice' });
            expect(collector.getCount()).to.equal(1);

            collector.dispose();
            collector.clear();

            pubsub.emit('user.logout', { userId: '1' });

            // Should still be 0 (not collecting after dispose)
            expect(collector.getCount()).to.equal(0);
        });
    });
});