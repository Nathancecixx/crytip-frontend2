'use client';

import { ApiError, apiPost } from './api';

export async function logout(): Promise<void> {
  try {
    await apiPost('/api/auth/logout', {});
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 404 || error.status === 405)
    ) {
      return;
    }
    throw error;
  }
}
