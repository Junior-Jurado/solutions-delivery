const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let cachedSecret = null;

async function getDbConfig() {
  if (cachedSecret) return cachedSecret;

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION
  });

  const command = new GetSecretValueCommand({
    SecretId: process.env.DB_SECRET_NAME
  });

  const response = await client.send(command);
  cachedSecret = JSON.parse(response.SecretString);

  return cachedSecret;
}

module.exports = { getDbConfig };
