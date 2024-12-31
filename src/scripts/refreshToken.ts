import { AuthService } from '../services/authService.js';

async function refreshToken() {
  try {
    const authService = new AuthService();
    await authService.getNewToken();
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
}

refreshToken(); 