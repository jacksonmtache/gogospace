export function isTestEnv() {
  return String(useRuntimeConfig().public.appEnv || '') === 'test'
}
