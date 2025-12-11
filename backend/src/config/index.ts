import databaseConfig from './database.config';
import authConfig from './auth.config';
import kubernetesConfig from './kubernetes.config';
import appConfig from './app.config';

export const configs = [
  databaseConfig,
  authConfig,
  kubernetesConfig,
  appConfig,
];
