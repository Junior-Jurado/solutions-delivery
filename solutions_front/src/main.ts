import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { logEnvironmentValidation } from './app/core/utils/environment-validator';

logEnvironmentValidation();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
