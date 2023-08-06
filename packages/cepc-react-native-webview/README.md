# CEPC React Native WebView

**This document is under construction.**

## Todos

- Write about how to call procedure

## WebView guest usage

1. Call `startGuestHandler`

- This function creates entrypoint to window for communicating with WebView host.

```typescript
startGuestHandler();
```

## WebView host usage

1. Create reference for WebView and assign
2. Generate host listener and set as `onMessage`
3. Optionally, console outputs inside WebView Guest can be bypassed by installing `bypassConsole`

```tsx
const webViewReference = useRef<WebView>(null);

const listener = useMemo(function () {
  return generateHostListener(function () {
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
