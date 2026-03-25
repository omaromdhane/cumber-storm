// import { expect } from "chai";
// import { IdGenerator } from "./id_generator";

// describe("IdGenerator", () => {
//     beforeEach(() => {
//         IdGenerator.reset();
//     });

//     describe("generate", () => {
//         it("generates sequential IDs starting from 1", () => {
//             const id1 = IdGenerator.generate();
//             const id2 = IdGenerator.generate();
//             const id3 = IdGenerator.generate();

//             expect(id1).to.equal("1");
//             expect(id2).to.equal("2");
//             expect(id3).to.equal("3");
//         });

//         it("generates unique IDs", () => {
//             const id1 = IdGenerator.generate();
//             const id2 = IdGenerator.generate();

//             expect(id1).to.not.equal(id2);
//         });

//         it("generates numeric IDs", () => {
//             const id = IdGenerator.generate();
//             expect(id).to.be.a('String');
//             expect(Number.isInteger(id)).to.be.true;
//         });

//         it("generates unique IDs in rapid succession", () => {
//             const ids = new Set();
//             for (let i = 0; i < 100; i++) {
//                 ids.add(IdGenerator.generate());
//             }
//             expect(ids.size).to.equal(100);
//         });

//         it("increments counter correctly", () => {
//             const id1 = IdGenerator.generate();
//             const id2 = IdGenerator.generate();

//             expect(id2).to.equal(id1 + 1);
//         });
//     });

//     describe("current", () => {
//         it("returns current counter value without incrementing", () => {
//             IdGenerator.generate();
//             IdGenerator.generate();
            
//             const current = IdGenerator.current();
//             const next = IdGenerator.generate();

//             expect(current).to.equal(2);
//             expect(next).to.equal(3);
//         });

//         it("returns 0 when no IDs generated", () => {
//             const current = IdGenerator.current();
//             expect(current).to.equal(0);
//         });
//     });

//     describe("reset", () => {
//         it("resets counter to 0", () => {
//             IdGenerator.generate();
//             IdGenerator.generate();
//             IdGenerator.reset();

//             const id = IdGenerator.generate();
//             expect(id).to.equal(1);
//         });

//         it("allows generating IDs after reset", () => {
//             IdGenerator.generate();
//             IdGenerator.reset();
            
//             const id1 = IdGenerator.generate();
//             const id2 = IdGenerator.generate();

//             expect(id1).to.equal(1);
//             expect(id2).to.equal(2);
//         });
//     });

//     describe("thread safety", () => {
//         it("handles concurrent generation without collisions", async () => {
//             const promises = [];
//             const ids: number[] = [];

//             for (let i = 0; i < 100; i++) {
//                 promises.push(
//                     Promise.resolve().then(() => {
//                         const id = IdGenerator.generate();
//                         ids.push(id);
//                         return id;
//                     })
//                 );
//             }

//             await Promise.all(promises);
            
//             const uniqueIds = new Set(ids);
//             expect(uniqueIds.size).to.equal(100);
//             expect(ids.length).to.equal(100);
//         });

//         it("maintains sequential order in single-threaded execution", () => {
//             const ids = [];
//             for (let i = 0; i < 10; i++) {
//                 ids.push(IdGenerator.generate());
//             }

//             for (let i = 0; i < ids.length - 1; i++) {
//                 expect(ids[i + 1]).to.equal(ids[i] + 1);
//             }
//         });
//     });

//     describe("collision resistance", () => {
//         it("generates 1000 unique IDs", () => {
//             const ids = new Set();
//             for (let i = 0; i < 1000; i++) {
//                 ids.add(IdGenerator.generate());
//             }
//             expect(ids.size).to.equal(1000);
//         });

//         it("generates 10000 unique IDs", () => {
//             const ids = new Set();
//             for (let i = 0; i < 10000; i++) {
//                 ids.add(IdGenerator.generate());
//             }
//             expect(ids.size).to.equal(10000);
//         });
//     });

//     describe("performance", () => {
//         it("generates IDs quickly", () => {
//             const start = Date.now();
//             for (let i = 0; i < 100000; i++) {
//                 IdGenerator.generate();
//             }
//             const duration = Date.now() - start;
            
//             // Should generate 100k IDs in less than 1 second
//             expect(duration).to.be.lessThan(1000);
//         });
//     });

//     describe("edge cases", () => {
//         it("handles large counter values", () => {
//             // Generate many IDs to test large counter values
//             for (let i = 0; i < 1000; i++) {
//                 IdGenerator.generate();
//             }
            
//             const id = IdGenerator.generate();
//             expect(id).to.equal(1001);
//         });

//         it("current() is thread-safe", () => {
//             IdGenerator.generate();
            
//             const current1 = IdGenerator.current();
//             const current2 = IdGenerator.current();
            
//             expect(current1).to.equal(current2);
//             expect(current1).to.equal(1);
//         });
//     });
// });
