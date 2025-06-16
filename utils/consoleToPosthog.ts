import posthog from 'posthog-react-native';

export default posthog;

export function setupConsoleToPosthog(userId?: string) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  function sendToPosthog(level: string, args: any[]) {
    try {
      posthog.capture('console_log', {
        level,
        message: args.map(String).join(' '),
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // Avoid infinite loop if posthog.capture fails
      originalError('Failed to send log to PostHog:', e);
    }
  }

  console.log = (...args) => {
    sendToPosthog('log', args);
    originalLog(...args);
  };
  console.warn = (...args) => {
    sendToPosthog('warn', args);
    originalWarn(...args);
  };
  console.error = (...args) => {
    sendToPosthog('error', args);
    originalError(...args);
  };
} 