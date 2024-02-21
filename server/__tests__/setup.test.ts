import request from 'supertest';
import { setupStrapi, stopStrapi } from '../../tests/strapi-helper';

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await stopStrapi();
});

it('Strapi should be defined', () => {
  expect(strapi).toBeDefined();
});
