import Bacon from 'baconjs';
import flatten from 'lodash/flatten';

// Store
const _busCache = {};

export default class Store {
  constructor(reducers, initialState) {
    this.reducers = reducers;
    this.initialState = initialState;
  }

  stream(name) {
    return this.bus(name);
  }

  push(name, value) {
    this.bus(name).push(value);
  }

  plug(name, value) {
    this.bus(name).plug(value);
  }

  bus(name) {
    return (_busCache[name] = _busCache[name] || new Bacon.Bus());
  }

  // bind Action Creators to Reducers and subscribe to changes
  subscribe(render) {
    const actionTypes = Object.keys(this.reducers);
    const boundActions = actionTypes.map(actionType => [
      [this.stream(actionType)],
      this.reducers[actionType]
    ]);

    // @TODO: instead of using initial state, force the reducers to run once
    // and read data from the store = initial state.
    // Merge it with another stream to emit once and instantly.
    return Bacon.update(this.initialState, ...flatten(boundActions)).onValue(
      state => render(state)
    );
  }
}
