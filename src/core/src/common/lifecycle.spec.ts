import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { IDisposable, isDisposable, DisposableStore, Disposable } from './lifecycle';

describe('lifecycle', () => {
    describe('isDisposable', () => {
        it('should return true for objects with dispose method', () => {
            const disposable = { dispose: () => {} };
            expect(isDisposable(disposable)).to.equal(true);
        });

        it('should return false for null', () => {
            expect(isDisposable(null)).to.equal(false);
        });

        it('should return false for undefined', () => {
            expect(isDisposable(undefined)).to.equal(false);
        });

        it('should return false for objects without dispose', () => {
            expect(isDisposable({})).to.equal(false);
            expect(isDisposable({ foo: 'bar' })).to.equal(false);
        });

        it('should return false for dispose with parameters', () => {
            const notDisposable = { dispose: (x: number) => {} };
            expect(isDisposable(notDisposable)).to.equal(false);
        });

        it('should return false for primitives', () => {
            expect(isDisposable(42)).to.equal(false);
            expect(isDisposable('string')).to.equal(false);
            expect(isDisposable(true)).to.equal(false);
        });
    });

    describe('DisposableStore', () => {
        let store: DisposableStore;

        beforeEach(() => {
            store = new DisposableStore();
        });

        describe('add', () => {
            it('should add disposable to store', () => {
                const disposable = { dispose: sinon.spy() };
                store.add(disposable);
                
                store.dispose();
                expect(disposable.dispose.calledOnce).to.equal(true);
            });

            it('should return the added disposable', () => {
                const disposable = { dispose: sinon.spy() };
                const result = store.add(disposable);
                expect(result).to.equal(disposable);
            });

            it('should handle null/undefined gracefully', () => {
                expect(() => store.add(null as any)).to.not.throw();
                expect(() => store.add(undefined as any)).to.not.throw();
            });

            it('should throw when adding itself', () => {
                expect(() => store.add(store as any)).to.throw('Cannot register a disposable on itself!');
            });

            it('should warn when adding to disposed store', () => {
                const consoleWarnStub = sinon.stub(console, 'warn');
                const disposable = { dispose: sinon.spy() };
                
                store.dispose();
                store.add(disposable);
                
                expect(consoleWarnStub.called).to.equal(true);
                consoleWarnStub.restore();
            });

            it('should not warn when DISABLE_DISPOSED_WARNING is true', () => {
                DisposableStore.DISABLE_DISPOSED_WARNING = true;
                const consoleWarnStub = sinon.stub(console, 'warn');
                const disposable = { dispose: sinon.spy() };
                
                store.dispose();
                store.add(disposable);
                
                expect(consoleWarnStub.called).to.equal(false);
                consoleWarnStub.restore();
                DisposableStore.DISABLE_DISPOSED_WARNING = false;
            });
        });

        describe('dispose', () => {
            it('should dispose all registered disposables', () => {
                const d1 = { dispose: sinon.spy() };
                const d2 = { dispose: sinon.spy() };
                const d3 = { dispose: sinon.spy() };
                
                store.add(d1);
                store.add(d2);
                store.add(d3);
                
                store.dispose();
                
                expect(d1.dispose.calledOnce).to.equal(true);
                expect(d2.dispose.calledOnce).to.equal(true);
                expect(d3.dispose.calledOnce).to.equal(true);
            });

            it('should mark store as disposed', () => {
                expect(store.isDisposed).to.equal(false);
                store.dispose();
                expect(store.isDisposed).to.equal(true);
            });

            it('should be idempotent', () => {
                const disposable = { dispose: sinon.spy() };
                store.add(disposable);
                
                store.dispose();
                store.dispose();
                store.dispose();
                
                expect(disposable.dispose.calledOnce).to.equal(true);
            });

            it('should handle empty store', () => {
                expect(() => store.dispose()).to.not.throw();
            });
        });

        describe('clear', () => {
            it('should dispose all disposables but not mark as disposed', () => {
                const d1 = { dispose: sinon.spy() };
                const d2 = { dispose: sinon.spy() };
                
                store.add(d1);
                store.add(d2);
                
                store.clear();
                
                expect(d1.dispose.calledOnce).to.equal(true);
                expect(d2.dispose.calledOnce).to.equal(true);
                expect(store.isDisposed).to.equal(false);
            });

            it('should allow adding new disposables after clear', () => {
                const d1 = { dispose: sinon.spy() };
                const d2 = { dispose: sinon.spy() };
                
                store.add(d1);
                store.clear();
                store.add(d2);
                store.dispose();
                
                expect(d1.dispose.calledOnce).to.equal(true);
                expect(d2.dispose.calledOnce).to.equal(true);
            });

            it('should handle empty store', () => {
                expect(() => store.clear()).to.not.throw();
            });
        });

        describe('delete', () => {
            it('should remove and dispose disposable', () => {
                const d1 = { dispose: sinon.spy() };
                const d2 = { dispose: sinon.spy() };
                
                store.add(d1);
                store.add(d2);
                
                store.delete(d1);
                
                expect(d1.dispose.calledOnce).to.equal(true);
                expect(d2.dispose.called).to.equal(false);
                
                store.dispose();
                expect(d2.dispose.calledOnce).to.equal(true);
            });

            it('should handle null/undefined gracefully', () => {
                expect(() => store.delete(null as any)).to.not.throw();
                expect(() => store.delete(undefined as any)).to.not.throw();
            });

            it('should throw when deleting itself', () => {
                expect(() => store.delete(store as any)).to.throw('Cannot dispose a disposable on itself!');
            });

            it('should dispose even if not in store', () => {
                const disposable = { dispose: sinon.spy() };
                store.delete(disposable);
                expect(disposable.dispose.calledOnce).to.equal(true);
            });
        });

        describe('deleteAndLeak', () => {
            it('should remove disposable without disposing', () => {
                const disposable = { dispose: sinon.spy() };
                
                store.add(disposable);
                store.deleteAndLeak(disposable);
                
                store.dispose();
                expect(disposable.dispose.called).to.equal(false);
            });

            it('should handle null/undefined gracefully', () => {
                expect(() => store.deleteAndLeak(null as any)).to.not.throw();
                expect(() => store.deleteAndLeak(undefined as any)).to.not.throw();
            });

            it('should handle disposable not in store', () => {
                const disposable = { dispose: sinon.spy() };
                expect(() => store.deleteAndLeak(disposable)).to.not.throw();
            });
        });
    });

    describe('Disposable', () => {
        class TestDisposable extends Disposable {
            public onDisposeCalled = sinon.spy();

            public override dispose(): void {
                this.onDisposeCalled();
                super.dispose();
            }

            public registerDisposable(d: IDisposable): IDisposable {
                return this._register(d);
            }
        }

        it('should dispose registered disposables', () => {
            const test = new TestDisposable();
            const d1 = { dispose: sinon.spy() };
            const d2 = { dispose: sinon.spy() };
            
            test.registerDisposable(d1);
            test.registerDisposable(d2);
            
            test.dispose();
            
            expect(d1.dispose.calledOnce).to.equal(true);
            expect(d2.dispose.calledOnce).to.equal(true);
        });

        it('should mark as disposed', () => {
            const test = new TestDisposable();
            expect(test['_isDisposed']).to.equal(false);
            test.dispose();
            expect(test['_isDisposed']).to.equal(true);
        });

        it('should throw when registering itself', () => {
            const test = new TestDisposable();
            expect(() => test.registerDisposable(test as any)).to.throw('Cannot register a disposable on itself!');
        });

        it('should have None disposable that does nothing', () => {
            expect(() => Disposable.None.dispose()).to.not.throw();
            Disposable.None.dispose();
            Disposable.None.dispose();
        });

        it('should return registered disposable', () => {
            const test = new TestDisposable();
            const disposable = { dispose: sinon.spy() };
            const result = test.registerDisposable(disposable);
            expect(result).to.equal(disposable);
        });
    });
});
