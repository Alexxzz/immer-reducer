/**
 * Fork from https://github.com/wkrueger/redutser
 */

import produce from "immer";

export const STATE = Symbol("initialState");
export const REDUCER = Symbol("reducer");
export const TYPES = Symbol("types");

type SecondArg<T> = T extends (x: any, y: infer V) => any ? V : never;
type Values<K> = K[keyof K];

export type Reducer<State, Payload = any> = (s: State, p: Payload) => State;

export interface ReducerDict<State> {
    [name: string]: (this: ReducerDict<State>, s: State, p: any) => State;
}

export type ActionCreatorsFromReducerDict<Inp extends ReducerDict<any>> = {
    [K in keyof Inp]: (
        payload: SecondArg<Inp[K]>,
    ) => {type: K; payload: SecondArg<Inp[K]>}
};

export type ActionTypesFromReducerDict<
    Inp extends ReducerDict<any>
> = ReturnType<Values<ActionCreatorsFromReducerDict<Inp>>>;

export const createSimpleActions = <State, Dict extends ReducerDict<State>>(
    initialState: State,
    reducerDict: Dict,
) => {
    const creators = _actionCreatorsFromReducerDict()(reducerDict);

    function reducer(
        state = initialState,
        action: ActionTypesFromReducerDict<Dict>,
    ): State {
        if (reducerDict[action.type]) {
            return produce(state, draftState => {
                return reducerDict[action.type](draftState, action.payload);
            });
        }
        return state;
    }

    return Object.assign({}, creators, {
        [REDUCER]: reducer,
        [STATE]: initialState,
        [TYPES]: (undefined as any) as ActionTypesFromReducerDict<Dict>,
    });
};

function _actionCreatorsFromReducerDict() {
    return <D extends ReducerDict<any>>(
        dict: D,
    ): ActionCreatorsFromReducerDict<D> => {
        return Object.keys(dict).reduce(
            (out, name) => ({
                ...out,
                [name]: (i: any) => ({type: name, payload: i}),
            }),
            {},
        ) as any;
    };
}