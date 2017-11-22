# stato

[![Travis](https://img.shields.io/travis/fknussel/stato.svg)](https://travis-ci.org/fknussel/stato)
[![npm](https://img.shields.io/npm/v/stato.svg)](https://www.npmjs.com/package/stato)
[![npm](https://img.shields.io/npm/l/stato.svg)](https://github.com/fknussel/stato/blob/master/LICENSE.md)
[![npm](https://img.shields.io/npm/dm/stato.svg)](https://www.npmjs.com/package/stato)
[![David](https://img.shields.io/david/fknussel/stato.svg)](https://github.com/fknussel/stato)

Super simple, opinionated functional reactive state management library powered by [Bacon.js](http://baconjs.github.io/) 🔥

## Installation

```
# npm
npm install stato

# yarn
yarn add stato
```

Then just import the main `Store` class (aka: function constructor) which is the controlling bus you need to instantiate.

```
import Store from 'stato';
```

## Development Tasks

| Command | Description |
|---------|-------------|
| `yarn install` | Fetch dependencies and build binaries for any of the modules |
| `yarn clean` | Remove `lib` directory |
| `yarn build` | Build `lib/stato.js` file |
| `yarn test` | Run test suite |

## Quick Start Guide

### 1) Define your **action types**

```js
export const SHOW_SPINNER = 'SPINNER/SHOW';
```

I usually define all actions within a single file for convenience.

### 2) Create your **reducers**

**Reducers are pure functions** that derive the next application state for a particular action, based on the current state and the payload the action provides. The first parameter reducers take is always the current state for the app, whereas the rest of the arguments are whatever data your reducer needs and you pass on to them.

**Reducers and action types have a 1:1 relationship.** You need to name your reducers after the action type they are bound to ⚠️ -- this is the only style convention this library has.

```js
export default {
  [SHOW_SPINNER]: state => (
    ...state,
    loading: true
  ),

  [HIDE_SPINNER]: state => (
    ...state,
    loading: false
  )
}
```

Of course reducers don't need to be inline functions, you can define them elsewhere and then bind them together in the format stato needs them to be in, something along the lines of this chunk of code... But this is totally up to you and depends on your preferred code style.

```js
export default {
  [SHOW_SPINNER]: showSpinnerReducer,
  [HIDE_SPINNER]: hideSpinnerReducer
}
```

### 3) Define your **initial state**

```js
const initialState = {
  loading: false
};
```

### 4) Instantiate your store

Make sure to pass in your reducer object plus the initial state for the application.

```js
const store = new Store(reducers, initialState);
```

### 5) Initialise your application state

```js
store.subscribe(props => {
  ReactDOM.render(
    <App {...props} />,
    document.getElementById('root')
  );
});
```

## TL;DR: Usage Example

Have a look at this [example](https://github.com/fknussel/stato-example).

## Motivation and Proposed Architecture

Just a lil bit of context first *re: functional reactive programming*. The most fundamental concept of [Functional Reactive Programming (FRP)](http://en.wikipedia.org/wiki/Functional_reactive_programming) is the **event stream**. Streams are like (immutable) arrays of events: they can be mapped, filtered, merged and combined. The difference between arrays and event streams is that values (events) of the event stream occur asynchronously. Every time an event occurs, it gets propagated through the stream and finally gets consumed by the subscriber.

We have [Flux](https://facebook.github.io/flux/) and other implementations such as [Redux](http://redux.js.org/) and [MobX](https://mobxjs.github.io/) to handle our app state, and in fact they do a great job abstracting our views from the *business logic* and keeping our **data flow unidirectional**. However, Reactive programming is what React was made for. So, what if we delegate the app state handling to FRP libraries like [Bacon.js](http://baconjs.github.io/) or [RxJS](http://reactivex.io/rxjs/)? Well, that actually makes a lot of sense:

1. Actions happen eventually and they propagate through event streams.
2. The combination of these event streams result in the app's state.
3. After an event has propagated through the system, the new state is consumed by the subscriber and rendered by the **root level** React component.

This makes the data flow super simple:

![Application Architecture](http://i.imgur.com/ButOsvf.png)

The fundamental idea behind this approach is that every user-triggered action gets pushed to the appropriate event stream, which is then merged in to the **application state** stream which is our single source of truth. Events take place at different points in time, and they cause the application state to change. Finally the updated state triggers a re-render of the root component, and React's virtual DOM takes care of the rest :tada: This results in **dead simple, dumb** React views, mostly powered by **[stateless functional components](https://facebook.github.io/react/docs/components-and-props.html#functional-and-class-components)** in favour of stateful class components (wherever possible).

## Triggering actions and the role of the view layer

State changes are only dispatched by actions. It's only throughout actions that we can update our application state.

Actions can be triggered:

* as a response to some user interaction (click on a button, form submission, scroll past the end of the page, etc.)
* as part of a lifecycle method (request data on componentWillMount). Note that I said "request data" and not "fetch data", that's because we cannot directly fetch data on a lifecycle hook as that's a side effect (talking to a server). We rather call a "request" data action that triggers the network call.
* as a cron job: as apart of our bootstrapping action we could set a bunch of timers (intervals) to periodically sync us with the server or update the internal state.

The bottom line here is that the View Layer ONLY and EXCLUSIVELY interacts with actions by importing them:

```
import {logout} from './state/actions';
```

And this is the only use case for importing files from the `state` directory.

Note that some actions are never used from the UI, for instance `RECEIVE_DATA` gets only triggered by the side effect triggered by `REQUEST_DATA`. The view layer doesn't necessarily need to be concerned with the entirety of the actions.

## About Side Effects

Side effects allow your application to interact with the outside world, i.e.: fetching data from an API, getting/setting data from/to `localStorage`/`sessionStorage`, talking to a database, etc.

Unlike reducers, effects are **not** pure functions.

Naturally effects may (and most usually do) trigger actions to update the application state once they are done making asynchronous operations.

For instance, consider this effect called `getUserDetails` that fetches a list of users from an API. Provided the Ajax request completes successfully, the effect will trigger the `RECEIVE_USER_DETAILS` action which simply updates the application state with those user details. This allows for a separation of concerns between hitting an API and updating the app state.

```js
export function getUserDetails() {
  store.push(SHOW_SPINNER); // triggers an action

  const ajaxCall = fetch('//api.github.com/users/fknussel')
    .then((response) => response.json());

  const userDetailsStream = Bacon
    .fromPromise(ajaxCall)
    .onValue((user) => {
      store.push(GET_USER_DETAILS, user); // triggers an action
      store.push(HIDE_SPINNER); // triggers an action
    });
}
```

Note that the user cannot directly trigger a side effect. Actions are the only ones allowed to do this.

Side effects include:
* API calls
* Local storage caching
* Logging, etc.

```
VIEW (React component) <--------------------|
  |                                         |
  | triggers                                |
  |                                         |
ACTION --->--causes--->-- SIDE EFFECTS      |
  |                                         |
  | invokes, passing data forward           ^
  |                                         |
REDUCER                                     |
  |                                         |
  | computes next state and updates store   |
  |                                         |
STORE ---->----notifies root component -->--|
```

Based on this, actions are not ALWAYS pure functions as they can trigger side effects. Reducers are, though.

## Using stato with other view libraries

stato is actually view-layer agnostic, so it can easily be used with any other UI library such as [Preact](https://preactjs.com/) or [Vue.js](https://vuejs.org/).

## TO DO

* Agree on how to set/define initial state: should it be passed in when creating the store? or should it be set on each particular reducer like Redux does with `combineReducers`? Is it the store the one that should be concerned with the initial state, or reducers ought to?
* Agree on whether to use context to pass props down (also, the way Redux does) and make it opt-in, or to case case down state from the top most component onto its children no matter how deep the hierarchy tree is. Or both, why not.
* Rewrite using RxJS.

## Complementary Readings, Inspiration and Credits

I've first used a somewhat similar architecture while at [Fox Sports Australia](https://github.com/FoxSportsAustralia/) and it made perfect sense. This was probably before or at the same time [Redux](http://redux.js.org/) and [MobX](https://mobxjs.github.io/) became popular.

[Matti Lankinen](https://github.com/milankinen) proposes the same idea on his [article on Medium](https://medium.com/@milankinen/good-bye-flux-welcome-bacon-rx-23c71abfb1a7). I've made tweaks and enhancements to this library after some of his comments and ideas.
