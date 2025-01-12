import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/stats', () => {
    return HttpResponse.json({
      success: true,
      data: {
        currentUsage: 30,
        limit: 100,
      },
    });
  }),
];
