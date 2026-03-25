import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { EventCollector, TypedPubSub } from '../common/events';
import { createEventCollector } from './global_event_collector';

describe('EventCollector', () => {
    interface TestEvents {
        'user.login': { userId: string; username: string };
        'user.logout': { userId: string };
        'order.created': { orderId: string; amount: number };
    }

    let emitter: TypedPubSub<TestEvents>;
    let collector: EventCollector<TestEvents>;

    beforeEach(() => {
        emitter = new TypedPubSub<TestEvents>();
        collector = new EventCollector(emitter);
    });

    describe('collection', () => {
        it('should collect emitted events', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });

            const events = collector.getAll();
            expect(events).to.have.lengthOf(2);
            expect(events[0].event).to.equal('user.login');
            expect(events[1].event).to.equal('user.logout');
        });

        it('should include timestamp and index', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });

            const events = collector.getAll();
            expect(events[0].timestamp).to.be.instanceOf(Date);
            expect(events[0].index).to.equal(0);
        });

        it('should increment index for each event', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });
            emitter.emit('user.login', { userId: '2', username: 'bob' });

            const events = collector.getAll();
            expect(events[0].index).to.equal(0);
            expect(events[1].index).to.equal(1);
            expect(events[2].index).to.equal(2);
        });
    });

    describe('getAsKeyValuePairs', () => {
        it('should return events as key-value pairs', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });

            const pairs = collector.getAsKeyValuePairs();
            expect(pairs).to.have.lengthOf(2);
            expect(pairs[0].key).to.equal('user.login');
            expect(pairs[0].value).to.deep.equal({ userId: '1', username: 'alice' });
            expect(pairs[1].key).to.equal('user.logout');
            expect(pairs[1].value).to.deep.equal({ userId: '1' });
        });
    });

    describe('getByEvent', () => {
        it('should filter events by type', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });
            emitter.emit('user.login', { userId: '2', username: 'bob' });

            const loginEvents = collector.getByEvent('user.login');
            expect(loginEvents).to.have.lengthOf(2);
            expect(loginEvents[0].data.username).to.equal('alice');
            expect(loginEvents[1].data.username).to.equal('bob');
        });
    });

    describe('getLast and getFirst', () => {
        beforeEach(() => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });
            emitter.emit('user.login', { userId: '2', username: 'bob' });
            emitter.emit('order.created', { orderId: 'O1', amount: 100 });
        });

        it('should get last N events', () => {
            const last2 = collector.getLast(2);
            expect(last2).to.have.lengthOf(2);
            expect(last2[0].event).to.equal('user.login');
            expect(last2[1].event).to.equal('order.created');
        });

        it('should get first N events', () => {
            const first2 = collector.getFirst(2);
            expect(first2).to.have.lengthOf(2);
            expect(first2[0].event).to.equal('user.login');
            expect(first2[1].event).to.equal('user.logout');
        });
    });

    describe('getByTimeRange', () => {
        it('should filter events by time range', (done) => {
            const start = new Date();
            
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            
            setTimeout(() => {
                const middle = new Date();
                emitter.emit('user.logout', { userId: '1' });
                
                setTimeout(() => {
                    const end = new Date();
                    emitter.emit('user.login', { userId: '2', username: 'bob' });
                    
                    const events = collector.getByTimeRange(middle, end);
                    expect(events.length).to.be.greaterThan(0);
                    done();
                }, 10);
            }, 10);
        });
    });

    describe('getCount and getCountByEvent', () => {
        beforeEach(() => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });
            emitter.emit('user.login', { userId: '2', username: 'bob' });
        });

        it('should return total count', () => {
            expect(collector.getCount()).to.equal(3);
        });

        it('should return count by event type', () => {
            const counts = collector.getCountByEvent();
            expect(counts.get('user.login')).to.equal(2);
            expect(counts.get('user.logout')).to.equal(1);
        });
    });

    describe('hasEvents and hasEvent', () => {
        it('should return false when no events collected', () => {
            expect(collector.hasEvents()).to.equal(false);
            expect(collector.hasEvent('user.login')).to.equal(false);
        });

        it('should return true when events collected', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            
            expect(collector.hasEvents()).to.equal(true);
            expect(collector.hasEvent('user.login')).to.equal(true);
            expect(collector.hasEvent('user.logout')).to.equal(false);
        });
    });

    describe('clear', () => {
        it('should clear all collected events', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });

            expect(collector.getCount()).to.equal(2);
            
            collector.clear();
            
            expect(collector.getCount()).to.equal(0);
            expect(collector.hasEvents()).to.equal(false);
        });

        it('should reset index after clear', () => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            collector.clear();
            emitter.emit('user.logout', { userId: '1' });

            const events = collector.getAll();
            expect(events[0].index).to.equal(0);
        });
    });

    describe('maxEvents option', () => {
        it('should limit collected events', () => {
            collector.dispose();
            collector = new EventCollector(emitter, { maxEvents: 2 });

            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });
            emitter.emit('user.login', { userId: '2', username: 'bob' });

            expect(collector.getCount()).to.equal(2);
            
            const events = collector.getAll();
            expect(events[0].event).to.equal('user.logout');
            expect(events[1].event).to.equal('user.login');
        });
    });

    describe('filter option', () => {
        it('should filter collected events', () => {
            collector.dispose();
            collector = new EventCollector(emitter, {
                filter: (event) => event === 'user.login'
            });

            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });
            emitter.emit('user.login', { userId: '2', username: 'bob' });

            expect(collector.getCount()).to.equal(2);
            expect(collector.hasEvent('user.login')).to.equal(true);
            expect(collector.hasEvent('user.logout')).to.equal(false);
        });
    });

    describe('export', () => {
        beforeEach(() => {
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            emitter.emit('user.logout', { userId: '1' });
        });

        it('should export as JSON', () => {
            const json = collector.toJSON();
            const parsed = JSON.parse(json);
            
            expect(parsed).to.be.an('array');
            expect(parsed).to.have.lengthOf(2);
        });

        it('should export as CSV', () => {
            const csv = collector.toCSV();
            
            expect(csv).to.include('index,event,timestamp,data');
            expect(csv).to.include('user.login');
            expect(csv).to.include('user.logout');
        });
    });

    describe('createEventCollector helper', () => {
        it('should create collector with helper function', () => {
            const newCollector = createEventCollector(emitter);
            
            emitter.emit('user.login', { userId: '1', username: 'alice' });
            
            expect(newCollector.getCount()).to.equal(1);
            
            newCollector.dispose();
        });
    });
});
