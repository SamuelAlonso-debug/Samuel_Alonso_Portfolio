/** On-demand responses (Actions) get the same `/*` headers that `public/_headers` gives static pages. */
import { defineMiddleware } from 'astro:middleware';
import headersFile from '../public/_headers?raw';
import { guardAction } from './lib/contact';
import { applyHeaders, parseHeadersFile } from './lib/headers';

const pageHeaders = parseHeadersFile(headersFile).get('/*') ?? new Map<string, string>();

export const onRequest = defineMiddleware(async (context, next) => {
  // Actions are the only server entry: refuse cross-site, non-POST or oversized calls unparsed.
  const blocked = context.url.pathname.startsWith('/_actions/')
    ? guardAction(context.request)
    : undefined;
  const response = blocked ?? (await next());
  if (context.isPrerendered) return response;
  // Some responses (redirects, proxied fetches) have immutable headers: copy first.
  return applyHeaders(new Response(response.body, response), pageHeaders);
});
