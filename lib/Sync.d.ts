import * as Async from './Async';
import { Either } from 'afpl';
export { Async };
/**
 * Precondition represents some condition that must be satisfied
 * in order for data to be considered a valid type.
 *
 * The left type class represents the original type and the
 * right the final one.
 */
export interface Precondition<A, B> {
    (value: A): Result<A, B>;
}
/**
 * Result is the result of a precondition.
 */
export declare type Result<A, B> = Either<Failure<A>, B>;
/**
 * Failures is a map of Failures.
 */
export interface Failures<A> {
    [key: string]: Failure<A>;
}
/**
 * Failure means a precondition did not go so well.
 */
export declare class Failure<A> {
    message: string;
    value: A;
    context: Context;
    constructor(message: string, value?: A, context?: Context);
    explain(templates?: {
        [key: string]: string;
    }, c?: Context): Expansion;
}
/**
 * Contexts is a map of Contexts.
 */
export interface Contexts {
    [key: string]: Context;
}
/**
 * Context of a failure, used to explain error messages.
 */
export interface Context {
    [key: string]: any;
}
export declare type Expansion = string | object;
export declare class ListFailure<A> extends Failure<A[]> {
    failures: Failures<A>;
    value: A[];
    contexts: Contexts;
    constructor(failures: Failures<A>, value: A[], contexts?: Contexts);
    explain(templates?: {
        [key: string]: string;
    }, c?: Context): Expansion;
}
/**
 * MapFailure is contains info on failures that occured while applying preconditions.
 */
export declare class MapFailure<A> extends Failure<Values<A>> {
    failures: Failures<A>;
    value: Values<A>;
    contexts: Contexts;
    constructor(failures: Failures<A>, value: Values<A>, contexts?: Contexts);
    explain(templates?: {
        [key: string]: string;
    }, c?: Context): Expansion;
}
/**
 * Values is a map of values to apply a map {@link Precondition} to.
 */
export interface Values<V> {
    [key: string]: V;
}
/**
 * @private
 */
export interface Reports<M, V> {
    failures: Failures<M>;
    values: Values<V>;
}
/**
 * A map of key precondition pairs.
 *
 * The right type class should be the union
 * of all possible values (or any) and the
 * right th union of all possible outcomes.
 */
export interface Preconditions<A, B> {
    [key: string]: Precondition<A, B>;
}
/**
 * @private
 */
export declare const whenLeft: <M, V>(key: string, {failures, values}: Reports<M, V>) => (f: Failure<M>) => {
    values: Values<V>;
    failures: Failures<M>;
};
/**
 * @private
 */
export declare const whenRight: <M, V>(key: string, {failures, values}: Reports<M, V>) => (v: V) => {
    failures: Failures<M>;
    values: Values<V>;
};
/**
 * left wraps a value in the left side of an Either
 */
export declare const left: <A, B>(a: A) => Either<A, B>;
/**
 * right wraps a value in the right side of an Either
 */
export declare const right: <A, B>(b: B) => Either<A, B>;
/**
 * fail produces a new one to one Failure instance wrapped
 * in the left side of an Either.
 */
export declare const fail: <A, B>(message: string, value: A, ctx?: Context) => Either<Failure<A>, B>;
/**
 * mapFail produces a new MapFailure wrapped in the left side
 * of an Either from a map (object) of failures.
 */
export declare const mapFail: <A, B>(errors: Failures<A>, value: Values<A>, contexts?: Contexts) => Either<MapFailure<A>, B>;
/**
 * listFail produces a new ListFailure wrapped in the left side
 * of an Either
 */
export declare const listFail: <A, B>(errors: Failures<A>, value: A[], contexts?: Contexts) => Either<ListFailure<A>, B[]>;
/**
 * valid signals a precondition has passed and wraps the latest
 * version of the value in the left side of an Either.
 */
export declare const valid: <A, B>(b: B) => Either<Failure<A>, B>;
/**
 * map accepts a javascript object whose properties are all preconditions
 * and returns a function that will apply each to the corresponding key.
 *
 * The A type class is the type of values the passed object is expected to
 * have and the B the resulting object/interface we get when all preconditions
 * pass.
 */
export declare const map: <A, B>(conditions: Preconditions<A, A>) => (value: Values<A>) => Either<Failure<Values<A>>, B>;
/**
 * partial is like map except it only applies to keys that exists
 * on the passed value.
 */
export declare const partial: <A, B>(conditions: Preconditions<A, A>) => (value: Values<A>) => Either<Failure<Values<A>>, B>;
/**
 * or
 */
export declare const or: <A, B>(l: Precondition<A, B>, r: Precondition<A, B>) => Precondition<A, B>;
/**
 * and
 */
export declare const and: <A, B>(left: Precondition<A, A>, right: Precondition<A, B>) => (value: A) => Either<Failure<A>, B>;
/**
 * set
 */
export declare const set: <A, B>(b: B) => (_a: A) => Either<Failure<{}>, B>;
/**
 * whenTrue does evaluates condition and decides
 * whether to return left if false or right if true.
 *
 * The evaluation is done before apply is called.
 */
export declare const whenTrue: <A, B>(condition: boolean, left: Precondition<A, B>, right: Precondition<A, B>) => (value: A) => Either<Failure<A>, B>;
/**
 * each applies a precondition for each member of an array.
 */
export declare const each: <A, B>(p: Precondition<A, B>) => Precondition<A[], B[]>;
/**
 * matches tests if the value satisfies a regular expression.
 */
export declare const matches: (pattern: RegExp) => (value: string) => Either<Failure<string>, string>;
/**
 * Measurable types for range tests.
 */
export declare type Measurable<A> = string | number | A[];
/**
 * range tests if a string, number or array falls within a range
 */
export declare const range: <A>(min: number, max: number) => Precondition<Measurable<A>, Measurable<A>>;
/**
 * equals tests if the value is equal to the value specified (strictly).
 */
export declare const equals: <A, B>(target: B) => (value: A) => Either<Failure<{}>, B> | Either<Failure<A>, {}>;
/**
 * required requires a value to be specified
 */
export declare const required: <A>(value: A) => Either<Failure<A>, {}> | Either<Failure<{}>, A>;
/**
 * optional applies the tests given only if the value is != null
 */
export declare const optional: <A, B>(p: Precondition<A, B>) => (value: A) => Either<Failure<{}>, A> | Either<Failure<A>, B>;
/**
 * upper transforms a string into uppercase
 */
export declare const upper: (s: string) => Either<Failure<string>, string>;
/**
 * lower transforms a string into lowercase
 */
export declare const lower: (s: string) => Either<Failure<string>, string>;
/**
 * number tests if a value is a number
 */
export declare const number: <A>(n: A) => Either<Failure<A>, number>;
/**
 * string tests if a value is a string
 */
export declare const string: <A>(a: A) => Either<Failure<A>, string>;
/**
 * array tests if the value is an array
 */
export declare const array: <A, B>(a: A) => Either<Failure<A>, B[]>;
/**
 * object tests if the value is an js object.
 */
export declare const object: <A>() => Precondition<A, A>;
/**
 * isin requires the value to be enumerated in the supplied list.
 */
export declare const isin: <A>(list: A[]) => Precondition<A, A>;
export declare const cast: <A, B>(f: (a: A) => B) => (a: A) => Either<Failure<{}>, B>;