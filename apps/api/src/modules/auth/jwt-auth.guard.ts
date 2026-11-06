import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Defines the jwt auth guard class contract. */ @Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
