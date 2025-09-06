const validModes = ['development', 'production', 'preview'] as const;
type EnvMode = typeof validModes[number];

function isEnvMode(value: string): value is EnvMode {
  return validModes.includes(value as EnvMode);
}

export function getEnvMode(): EnvMode {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE && isEnvMode(import.meta.env.MODE)) {
    return import.meta.env.MODE;
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV && isEnvMode(process.env.NODE_ENV)) {
    return process.env.NODE_ENV;
  }

  return 'development';
}