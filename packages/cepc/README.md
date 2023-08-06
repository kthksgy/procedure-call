# CEPC - Contextual External Procedure Call

CEPC is a procedure call interface designed for communication across different contexts, such as Window, React Native WebView or Service Worker.

CEPC has following features.

- Simple
- High compatibility
  - Can be used when two contexts can send string each other !
- Supports `async` / `await`
- Fully typed
- Small (less than 5KB when Gzipped)
- Standalone
  - No dependencies !

## Context specific libraries

There are some context specific libraries for CEPC.

If you are planning to use CEPC with these ccontexts, try it first !

- [React Native WebView](../cepc-react-native-webview)
- [Service Worker](../cepc-service-worker)

## Installation

Run command below.

```
# npm
$ npm install cepc

# yarn
$ yarn add cepc
```

## Create an interface for any context

To create an interface, you should create 2 things.

- A method to call a procedure.
- A handler to handle packets.

TODO: Write.
