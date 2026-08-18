const isEnabled = value => String(value || '').toLowerCase() === 'true';

const getFoxReloadExecutionConfig = (env = process.env) => {
  const enabled = isEnabled(env.FOXRELOAD_SANDBOX_ENABLED);
  const hasCredentials = Boolean(env.FOXRELOAD_SANDBOX_BASE_URL && env.FOXRELOAD_SANDBOX_API_KEY);

  return {
    enabled: enabled && hasCredentials,
    reason: !enabled
      ? 'FOXRELOAD_SANDBOX_NOT_CONFIGURED'
      : !hasCredentials
        ? 'FOXRELOAD_SANDBOX_CREDENTIALS_MISSING'
        : null,
    baseUrl: enabled && hasCredentials ? env.FOXRELOAD_SANDBOX_BASE_URL : null
  };
};

module.exports = { getFoxReloadExecutionConfig };
