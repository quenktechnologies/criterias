import { Precondition } from './';
import { Type } from '@quenk/noni/lib/data/type';
/**
 * isArray tests if the value is an array
 */
export declare const isArray: Precondition<Type, Type[]>;
/**
 * notEmpty tests if an array has at least one member.
 */
export declare const notEmpty: <A>(value: A[]) => import("./result").Result<A[], A[]>;
/**
 * max sets a maximum number of elements the array can contain.
 */
export declare const max: <A>(target: number) => Precondition<A[], A[]>;
/**
 * min sets a minimum number of elements the array can contain.
 */
export declare const min: <A>(target: number) => Precondition<A[], A[]>;
/**
 * range tests whether an array's length falls within a specific min and max range.
 */
export declare const range: <A>(min: number, max: number) => (value: A[]) => import("./result").Result<A[], unknown> | import("./result").Result<unknown, A[]>;
/**
 * filter applies a precondition to each member of an array producing
 * an array where only the successful members are kept.
 */
export declare const filter: <A, B>(p: Precondition<A, B>) => Precondition<A[], B[]>;
/**
 * map applies a precondition to each member of an array.
 *
 * If the precondition fails for any of the members,
 * the entire array is considered a failure.
 */
export declare const map: <A, B>(p: Precondition<A, B>) => Precondition<A[], B[]>;
/**
 * tuple tests whether the value supplied qualifies as a tuple.
 *
 * Each precondition in the list represents a precondition for its
 * corresponding tuple element.
 */
export declare const tuple: <A, B>(list: Precondition<A, B>[]) => Precondition<A[], B[]>;
