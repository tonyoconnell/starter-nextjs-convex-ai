/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server';
import type * as auth from '../auth.js';
import type * as coverage_lcov_report_block_navigation from '../coverage/lcov-report/block-navigation.js';
import type * as coverage_lcov_report_prettify from '../coverage/lcov-report/prettify.js';
import type * as coverage_lcov_report_sorter from '../coverage/lcov-report/sorter.js';
import type * as email from '../email.js';
import type * as migrations from '../migrations.js';
import type * as queries from '../queries.js';
import type * as users from '../users.js';

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  'coverage/lcov-report/block-navigation': typeof coverage_lcov_report_block_navigation;
  'coverage/lcov-report/prettify': typeof coverage_lcov_report_prettify;
  'coverage/lcov-report/sorter': typeof coverage_lcov_report_sorter;
  email: typeof email;
  migrations: typeof migrations;
  queries: typeof queries;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>;
