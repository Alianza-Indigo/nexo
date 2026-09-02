const forbiddenKeys = /audio|transcript|name|diagnos|phone|email|address|report|token|url|content|narrative/i;
export function redactMetadata(value: Record<string, unknown>) { return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, forbiddenKeys.test(key) ? "[REDACTED]" : typeof item === "string" && item.length > 100 ? `${item.slice(0, 20)}…` : item])); }
