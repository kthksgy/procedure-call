# CEPC React Native WebView

**This document is under construction.**

## Todos

- Add tests
- Write about how to call procedure

## Installation

Run command below.

```
# npm
$ npm install cepc cepc-react-native-webview

# yarn
$ yarn add cepc-cepc-react-native-webview
```

## WebView guest usage

1. Call `startGuestHandler`

- This function creates entrypoint to window for communicating with WebView host.

```typescript
startWebViewGuestHandler();
```

## WebView host usage

1. Create reference for WebView and assign
2. Generate host listener and set as `onMessage`
3. Optionally, console outputs inside WebView Guest can be bypassed by installing `bypassConsole`

```tsx
const webViewReference = useRef<WebView>(null);

const listener = useMemo(function () {
  return generateWebViewHostListener(function () {
    return webViewReference.current;
  });
}, []);

return (
  <WebView
    injectedJavaScript={generateBypassConsoleInstaller() + 'true;'}
    onMessage={listener}
    ref={webViewReference}
  />
);
```
