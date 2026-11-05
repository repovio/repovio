import { Controller, Get, Injectable, Module, Query, type OnModuleInit } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ApiQuery } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';

import { configureApiRoutes, createApiDocument } from './document.js';

const initialized = jest.fn();

@Injectable()
class LifecycleProbe implements OnModuleInit {
  onModuleInit(): void {
    initialized();
  }
}

@Controller('fixture')
class ReferenceFixtureController {
  @Get('first')
  @ApiQuery({
    name: 'where',
    required: false,
    schema: { $ref: '#/$defs/__schema0' },
    ...{ 'x-nestjs_zod-$defs': { __schema0: { type: 'string' } } },
  })
  first(@Query() query: unknown): unknown {
    return query;
  }

  @Get('second')
  @ApiQuery({
    name: 'where',
    required: false,
    schema: { $ref: '#/$defs/__schema0' },
    ...{ 'x-nestjs_zod-$defs': { __schema0: { type: 'number' } } },
  })
  second(): void {}
}

@Module({ controllers: [ReferenceFixtureController], providers: [LifecycleProbe] })
class FixtureModule {}

describe('shared API document generation', () => {
  it('uses versioned server routes without running lifecycle hooks or listening', async () => {
    const module = await Test.createTestingModule({ imports: [FixtureModule] }).compile();
    const app = module.createNestApplication(new FastifyAdapter());
    const listen = jest.spyOn(app, 'listen');
    const init = jest.spyOn(app, 'init');
    try {
      configureApiRoutes(app);
      const installed = createApiDocument(app, 'https://instance.example.invalid');
      const portable = createApiDocument(app, '/');
      expect(portable.paths).toEqual(installed.paths);
      expect(portable.components).toEqual(installed.components);
      expect(portable.paths['/api/v1/fixture/first']).toBeDefined();
      expect(portable.servers).toEqual([{ url: '/' }]);
      expect(installed.servers).toEqual([{ url: 'https://instance.example.invalid' }]);
      expect(init).not.toHaveBeenCalled();
      expect(listen).not.toHaveBeenCalled();
      expect(initialized).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
  it('keeps different anonymous parameter schemas separate with resolvable references', async () => {
    const module = await Test.createTestingModule({ imports: [FixtureModule] }).compile();
    const app = module.createNestApplication(new FastifyAdapter());
    try {
      configureApiRoutes(app);
      const document = createApiDocument(app, '/');
      const references: string[] = [];
      for (const path of ['/api/v1/fixture/first', '/api/v1/fixture/second']) {
        const parameter = document.paths[path].get!.parameters![0];
        expect(parameter).not.toHaveProperty('x-nestjs_zod-$defs');
        if ('schema' in parameter && parameter.schema && '$ref' in parameter.schema)
          references.push(parameter.schema.$ref);
      }
      expect(new Set(references).size).toBe(2);
      expect(references.map((ref) => document.components!.schemas![ref.split('/').at(-1)!])).toEqual([
        { type: 'string' },
        { type: 'number' },
      ]);
    } finally {
      await app.close();
    }
  });
});
