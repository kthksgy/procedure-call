# @kthksgy/procedure-call

@kthksgy/procedure-call is a procedure call interface designed for communication across different contexts, such as Window, React Native WebView or Service Worker.

## Todos

- Complete `README.md` and other documents
- Translate commonly visible Japanese comments to English
  - Currently, almost all comments which can be displayed in VSCode are Japanese.

## Features

@kthksgy/procedure-call has following features.

- Simple
- High compatibility
  - This can be used when two contexts can send string each other !
- Supports `async` / `await`
- Fully typed
- Small (less than 5KB when Gzipped)
- Standalone
  - No dependencies !

## Context specific libraries

There are some context specific libraries for @kthksgy/procedure-call.

If you are planning to use @kthksgy/procedure-call with these ccontexts, try it first !

- [React Native WebView](../react-native-web-view)
- [Service Worker](../service-worker)

## Installation

Run command below.

```
# npm
$ npm install @kthksgy/procedure-call

# yarn
$ yarn add @kthksgy/procedure-call
```

## Create an interface for any context

To create an interface, you should create 2 things.

- A method to call a procedure.
- A handler to handle packets.

TODO: Write.
