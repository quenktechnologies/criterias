import * as afpl from 'afpl';
import * as polate from '@quenk/polate';
import * as Async from './Async';
import { Either } from 'afpl';

export { Async }

/**
 * Precondition represents some condition that must be satisfied
 * in order for data to be considered a valid type.
 */
export interface Precondition<A, B> {

    (value: A): Result<A, B>;

}


/**
 * Result is the result of a precondition.
 */
export type Result<A, B> = Either<Failure<A>, B>;

/**
 * Failures is a map of Failures.
 */
export interface Failures<A> {

    [key: string]: Failure<A>

}

/**
 * Failure means a precondition did not go so well.
 */
export class Failure<A> {

    constructor(public message: string, public value?: A, public context: Context = {}) { }

    expand(templates: { [key: string]: string } = {}, c: Context = {}): Expansion {

        let combined = (typeof c['$key'] === 'string') ?
            `${c.$key}.${this.message}` :
            this.message;
        let key = c.$key;
        let $value = this.value;

        return polate.polate(
            ((templates[combined]) ?
                templates[combined] :
                (templates[<string>key]) ?
                    templates[<string>key] :
                    (templates[this.message]) ?
                        templates[this.message] :
                        this.message), afpl.util.merge(this.context, c, <any>{ $value }));

    }

}

/**
 * Contexts is a map of Contexts.
 */
export interface Contexts {

    [key: string]: Context

}

/**
 * Context of a failure, used to expand error messages.
 */
export interface Context {

    [key: string]: any

}

export type Expansion
    = string
    | object
    ;

export class ListFailure<A> extends Failure<A[]> {

    constructor(
        public failures: Failures<A>,
        public value: A[],
        public contexts: Contexts = {}) { super('list', value, contexts); }

    expand(templates: { [key: string]: string } = {}, c: Context = {}): Expansion {

        return afpl.util.reduce(this.failures, ((o, f, $index) =>
            afpl.util.merge(o, {
                [$index]: f.expand(templates, afpl.util.merge(c, { $index }))
            })), {});

    }

}

/**
 * MapFailure is contains info on failures that occured while applying preconditions.
 */
export class MapFailure<A> extends Failure<Values<A>> {

    constructor(
        public failures: Failures<A>,
        public value: Values<A>,
        public contexts: Contexts = {}) { super('map', value, contexts); }

    expand(templates: { [key: string]: string } = {}, c: Context = {}): Expansion {

        return afpl.util.reduce(this.failures, (o, f, $key) =>
            afpl.util.merge(o, {
                [$key]: f.expand(templates, afpl.util.merge(c, { $key }))
            }), {});

    }

}

/**
 * Values is the map of values to apply the preconditions to.
 */
export interface Values<V> {

    [key: string]: V

}

export interface Reports<M, V> {

    failures: Failures<M>
    values: Values<V>

}

/**
 * A map of key precondition pairs
 */
export interface Preconditions<A, B> {

    [key: string]: Precondition<A, B>

}

export const whenLeft:
    <M, V>(
        k: string,
        r: Reports<M, V>) =>
        (f: Failure<M>) =>
            Reports<M, V> =
    <M, V>(key: string, { failures, values }: Reports<M, V>) =>
        (f: Failure<M>): Reports<M, V> => ({
            values,
            failures: afpl.util.merge<Failures<M>, Failures<M>>(failures, {
                [key]: f
            })
        });

export const whenRight
    : <M, V>(
        k: string,
        r: Reports<M, V>) =>
        (v: V) =>
            Reports<M, V> =
    <M, V>(
        key: string,
        { failures, values }: Reports<M, V>) =>
        (v: V): Reports<M, V> => (v == null) ?
            { failures, values } :
            ({
                failures,
                values: afpl.util.merge<Values<V>, Values<V>>(values, {
                    [key]: v
                })
            });

export const left: <A, B>(a: A) => afpl.Either<A, B> = afpl.Either.left;

export const right: <A, B>(b: B) => afpl.Either<A, B> = afpl.Either.right;

export const fail: <A, B>(m: string, v: A, ctx?: Context) =>
    afpl.Either<Failure<A>, B> =
    <A, B>(message: string, value: A, ctx: Context = {}) =>
        afpl.Either.left<Failure<A>, B>(new Failure(message, value, ctx));

export const mapFail: <A, B>(e: Failures<A>, v: Values<A>, c?: Contexts) =>
    afpl.Either<MapFailure<A>, B> =
    <A, B>(errors: Failures<A>, value: Values<A>, contexts: Contexts = {}) =>
        afpl.Either.left<MapFailure<A>, B>(new MapFailure(errors, value, contexts));

export const valid: <A, B>(b: B) => afpl.Either<Failure<A>, B> =
    <A, B>(b: B) => afpl.Either.right<Failure<A>, B>(b);

/**
 * map accepts a javascript object whose properties are all preconditions
 * and returns a function that will apply each to input.
 */
export const map: <A, AB, B>(conditions: Preconditions<A, AB>) => Precondition<Values<A>, B> =

    <A, AB, B>(conditions: Preconditions<any, any>) => (value: Values<A>) => {

        let init: Reports<A, AB> = { failures: {}, values: {} };

        if (typeof value !== 'object') {

            return mapFail<A, B>({}, value);

        } else {

            let reports = afpl.util.reduce(conditions,
                (r: Reports<A, AB>, p: Precondition<A, AB>, k: string) =>

                    p.apply(null, value[k])
                        .cata(
                        whenLeft(k, r),
                        whenRight(k, r)), init);

            if (Object.keys(reports.failures).length > 0)
                return mapFail<A, B>(reports.failures, value);
            else
                return valid<Values<A>, B>(reports.values);

        }
    }

/**
 * partial is like map except it only applies to keys that exists
 */
export const partial =
    <A, AB, B>(conditions: Preconditions<A, AB>) =>
        (value: Values<A>) => {

            let init: Reports<A, AB> = { failures: {}, values: {} };

            if (typeof value !== 'object') {

                return mapFail<A, B>({}, value);

            } else {

                let reports = afpl.util.reduce(value,
                    (r: Reports<A, AB>, value: A, k: string) =>
                        (conditions.hasOwnProperty(k)) ?
                            conditions[k].apply(null, value)
                                .cata(whenLeft(k, r), whenRight(k, r)) :
                            r, init);

                if (Object.keys(reports.failures).length > 0)
                    return mapFail<A, B>(reports.failures, value);
                else
                    return valid<Values<A>, B>(reports.values);

            }

        }


/**
 * or
 */
export const or: <A, B>(l: Precondition<A, B>, r: Precondition<A, B>) =>
    Precondition<A, B> =
    <A, B>(left: Precondition<A, B>, right: Precondition<A, B>) =>
        (value: A) =>
            left
                .apply(null, value)
                .cata(() => right.apply(null, value), (b: B) => valid(b));

/**
 * and
 */
export const and: <A, B>(l: Precondition<A, A>, r: Precondition<A, B>) =>
    Precondition<A, B> =
    <A, B>(left: Precondition<A, A>, right: Precondition<A, B>) =>
        (value: A) =>
            left
                .apply(null, value)
                .cata(
                afpl.Either.left,
                (v: A) => right.apply(null, v));

/**
 * set 
 */
export const set: <A, B>(v: B) => Precondition<A, B> =
    <B>(v: B) => (_a: any) => valid(v);

/**
 * whenTrue does evaluates condition and decides
 * whether to return left if false or right if true.
 *
 * The evaluation is done before apply is called.
 */
export const whenTrue: <A, B>(
    c: boolean,
    l: Precondition<A, B>,
    r: Precondition<A, B>) =>
    (value: A) => Result<A, B> =
    <A, B>(
        condition: boolean,
        left: Precondition<A, B>,
        right: Precondition<A, B>) =>
        (value: A) => (condition ? right.apply(null, value) : left.apply(null, value));

/**
 * each applies a precondition for each member of an array.
 */
export const each: <A, B>(p: Precondition<A, B>) => Precondition<A[], B[]> =
    <A, B>(p: Precondition<A, B>) =>
        (value: A[]) => {

            let r = value.reduce(({ failures, values }, a, k) =>
                p.apply(null, a).cata(
                    (f: Failure<A>) => ({
                        values,
                        failures: afpl.util.merge(failures, { [k]: f })
                    }),
                    (b: B) => ({
                        failures,
                        values: values.concat(b)
                    })), { failures: {}, values: [] });

            if (Object.keys(r.failures).length > 0)
                return afpl.Either.left<ListFailure<A>, B[]>(new ListFailure(r.failures, value));
            else
                return valid<A[], B[]>(r.values);

        }

/**
 * isin requires the value to be enumerated in the supplied list.
 */
export const isin: <A>(list: A[]) => Precondition<A, A> = <A>(list: A[]) =>
    (value: A) =>
        (list.indexOf(value) < 0) ?
            fail('isin', value, { list }) :
            valid(value)


/**
 * object tests if the value is an js object.
 */
export const object: <A>() => Precondition<A, A> =
    <A>() =>
        (value: A) =>
            (typeof value === 'object' && (!Array.isArray(value))) ?
                valid<A, A>(value) :
                fail<A, A>('object', <any>value);

/**
 * matches tests if the value satisfies a regular expression.
 */
export const matches: (pattern: RegExp) => Precondition<string, string> =
    (pattern: RegExp) =>
        (value: string) =>
            (!pattern.test(value)) ?
                fail<string, string>('matches', value, { pattern: pattern.toString() }) :
                valid<string, string>(value)

/**
 * Measurable types. 
 */
export type Measurable<A>
    = string
    | number
    | A[]
    ;

/**
 * range tests if a string, number or array falls within a range
 */
export const range: <A>(min: number, max: number) => Precondition<Measurable<A>, Measurable<A>> =
    <A>(min: number = 0, max: number = Infinity) =>
        (value: Measurable<A>) => {

            let test = ((Array.isArray(value)) || (typeof value === 'string')) ?
                value.length :
                value;

            return (test < min) ?
                fail<number, number>('range.min', test, { min, max }) :
                (test > max) ?
                    fail<number, number>('range.max', test, { min, max }) :
                    valid<number, number>(test);

        }

const isB = <B>(a: any, b: B): a is B => (a === b)

/**
 * equals tests if the value is equal to the value specified (strictly).
 */
export const equals: <A, B>(target: B) => Precondition<A, B> =
    <A, B>(target: B) =>
        (value: A) => isB(value, target) ?
            valid(target) :
            fail('equals', value, { target });

/**
 * required requires a value to be specified
 */
export const required = <A>(value: A) =>
    ((value == null) || ((typeof value === 'string') && (value === ''))) ?
        fail('notNull', value) :
        valid(value)


/**
 * optional applies the tests given only if the value is != null
 */
export const optional: <A, B>(t: Precondition<A, B>) => (v: A) => Precondition<A, B> =
    <A, B>(p: Precondition<A, B>) =>
        (value: A) =>
            (value == null) ?
                valid(null) :
                p.apply(null, value);

/**
 * upper transforms a string into uppercase
 */
export const upper: Precondition<string, string> =
    (s: string) => valid<string, string>(s.toUpperCase());

/**
 * lower transforms a string into lowercase
 */
export const lower: Precondition<string, string> =
    (s: string) => valid<string, string>(s.toLowerCase());

/**
 * number tests if a value is a number
 */
export const number: Precondition<any, number> =
    <A>(n: A) => (typeof n === 'number') ?
        valid<any, number>(n) :
        fail<any, number>('number', {});

/**
 * string tests if a value is a string
 */
export const string: Precondition<any, string> =
    <A>(a: A) => (typeof a === 'string') ?
        valid<A, string>(a) :
        fail<A, string>('string', a);

/**
 * array tests if the value is an array
 */
export const array: Precondition<any, any[]> =
    <A, B>(a: A) =>
        (Array.isArray(a)) ?
            valid<A, B[]>(a) :
            fail<A, B[]>('array', a);

export const cast: <A, B>(f: (a: A) => B) => Precondition<A, B> =
    <A, B>(f: (a: A) => B) => (a: A) => valid(f(a));

