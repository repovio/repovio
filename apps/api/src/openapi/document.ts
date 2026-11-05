import { RequestMethod, VersioningType, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/**
 * Apply the route conventions shared by the HTTP server and offline schema export.
 *
 * @param app - Nest application whose controller metadata will be scanned.
 * @returns No return value.
 */
export function configureApiRoutes(app: INestApplication): void {
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api', { exclude: [{ path: 'mcp', method: RequestMethod.POST }] });
}

/**
 * Build the public transport contract without initializing or listening on the application.
 *
 * @param app - Nest application containing the real feature modules and controllers.
 * @param serverUrl - Deployment origin, or a relative root for a portable export.
 * @returns The same Zod-cleaned OpenAPI contract used by the installed API reference.
 */
export function createApiDocument(app: INestApplication, serverUrl: string): OpenAPIObject {
  return cleanupOpenApiDoc(
    namespaceParameterDefinitions(
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('Repovio API')
          .setDescription('Read-only workflow status tracking API.')
          .setVersion('1.0')
          .addBearerAuth()
          .addServer(serverUrl)
          .build(),
      ),
    ),
  );
}

/**
 * Scope Zod's anonymous query definitions per parameter before cleanup registers them globally.
 *
 * @param document - Raw Swagger document containing nestjs-zod parameter metadata.
 * @returns The document with equivalent references and unique anonymous definition names.
 */
function namespaceParameterDefinitions(document: OpenAPIObject): OpenAPIObject {
  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const) {
      const operation = item[method];
      if (!operation?.parameters) continue;
      operation.parameters = operation.parameters.map((parameter, index) => {
        const definitions = (parameter as unknown as Record<string, unknown>)['x-nestjs_zod-$defs'];
        if (!definitions || typeof definitions !== 'object') return parameter;
        const prefix = `Query_${Buffer.from(`${method}:${path}:${index}`).toString('hex')}_`;
        const names = new Map(
          Object.keys(definitions)
            .filter((name) => name.startsWith('__schema'))
            .map((name) => [name, prefix + name]),
        );
        return JSON.parse(
          JSON.stringify(parameter, (key, value) => {
            if (key === 'x-nestjs_zod-$defs' && value && typeof value === 'object') {
              return Object.fromEntries(
                Object.entries(value).map(([name, schema]) => [names.get(name) ?? name, schema]),
              );
            }
            if (key === '$ref' && typeof value === 'string' && value.startsWith('#/$defs/')) {
              const name = value.slice('#/$defs/'.length);
              return `#/$defs/${names.get(name) ?? name}`;
            }
            return value;
          }),
        );
      });
    }
  }
  return document;
}
