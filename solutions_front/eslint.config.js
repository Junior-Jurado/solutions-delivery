// @ts-check
// =============================================================================
// ESLint Configuration - Solutions Delivery Frontend
// =============================================================================
// Este archivo configura las reglas de linting para el proyecto Angular.
//
// REGLAS RELAJADAS TEMPORALMENTE:
// - prefer-inject: Requiere migrar todos los constructores a inject()
// - prefer-control-flow: Requiere migrar *ngIf/*ngFor a @if/@for
// - no-explicit-any: Muchos lugares usan 'any', cambiar gradualmente
//
// TODO: Ejecutar estas migraciones cuando haya tiempo:
//   ng generate @angular/core:inject
//   ng generate @angular/core:control-flow
// =============================================================================

const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const security = require("eslint-plugin-security");

module.exports = defineConfig([
  // ===========================================================================
  // CONFIGURACIÓN PARA ARCHIVOS TYPESCRIPT (*.ts)
  // ===========================================================================
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // =========================================================================
      // REGLAS DE ANGULAR - Selectores
      // =========================================================================
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],

      // =========================================================================
      // REGLAS RELAJADAS - Requieren migraciones grandes
      // =========================================================================
      // OFF: Requiere migrar todos los constructores a inject()
      // Ejecutar: ng generate @angular/core:inject
      "@angular-eslint/prefer-inject": "off",

      // =========================================================================
      // REGLAS DE TYPESCRIPT - Relajadas para proyecto existente
      // =========================================================================
      // WARN: Permite 'any' pero muestra advertencia
      // Ideal: Ir reemplazando 'any' por tipos específicos gradualmente
      "@typescript-eslint/no-explicit-any": "warn",

      // WARN: Variables no usadas (a veces son intencionales en catch blocks)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",        // Ignorar args que empiecen con _
          varsIgnorePattern: "^_",        // Ignorar vars que empiecen con _
          caughtErrorsIgnorePattern: "^_" // Ignorar errores en catch
        }
      ],

      // =========================================================================
      // REGLAS RELAJADAS - Permiten migración gradual
      // =========================================================================
      // WARN: Funciones vacías (a veces son placeholders intencionales)
      "@typescript-eslint/no-empty-function": "warn",

      // WARN: Outputs con nombres nativos (ej: @Output() change)
      // Ideal: Renombrar a nombres más específicos gradualmente
      "@angular-eslint/no-output-native": "warn",

      // WARN: Lifecycle methods vacíos
      "@angular-eslint/no-empty-lifecycle-method": "warn",

      // WARN: Declaraciones léxicas en case blocks
      // Ideal: Envolver en llaves { } o extraer a funciones
      "no-case-declarations": "warn",
    },
  },

  // ===========================================================================
  // CONFIGURACIÓN DE SEGURIDAD
  // ===========================================================================
  {
    files: ["**/*.ts"],
    plugins: {
      security: security,
    },
    rules: {
      // ERROR: eval() es peligroso, nunca usarlo
      "security/detect-eval-with-expression": "error",
      // OFF: Genera muchos falsos positivos en acceso a diccionarios
      // con claves conocidas (ej: translations[key])
      "security/detect-object-injection": "off",
    },
  },

  // ===========================================================================
  // CONFIGURACIÓN PARA TEMPLATES HTML (*.html)
  // ===========================================================================
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // =========================================================================
      // REGLAS RELAJADAS - Requieren migraciones grandes
      // =========================================================================
      // OFF: Requiere migrar *ngIf, *ngFor a @if, @for (Angular 17+)
      // Ejecutar: ng generate @angular/core:control-flow
      "@angular-eslint/template/prefer-control-flow": "off",

      // =========================================================================
      // ACCESIBILIDAD - Relajadas a WARN
      // =========================================================================
      // WARN: Click events deben tener keyboard events (a11y)
      "@angular-eslint/template/click-events-have-key-events": "warn",
      // WARN: Elementos interactivos deben ser focusables (a11y)
      "@angular-eslint/template/interactive-supports-focus": "warn",
      // WARN: Labels deben estar asociados a form controls (a11y)
      // Ideal: Usar for="" o envolver el input dentro del label
      "@angular-eslint/template/label-has-associated-control": "warn",
    },
  },
]);
