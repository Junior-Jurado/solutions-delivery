export const environment = {
  production: true,

  apiBaseUrl: 'https://api.tudominio.com',

  cognito: {
    userPoolId: 'us-east-1_PRODPOOL',
    clientId: 'PROD_CLIENT_ID'
  }
};
// ng build --configuration production