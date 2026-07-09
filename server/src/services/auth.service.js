const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const store = require('../database/database.postgrace');
const { AuthenticationError, ConflictError } = require('../exceptions');

class AuthService {
  async register({ username, email, password, displayName }) {
    const existingUser = await store.findUserFirst({
      OR: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email is already registered');
      }
      throw new ConflictError('Username is already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await store.createUser({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
    });

    const tokens = await this.generateTokens(user.id);

    return { user: store.sanitizeUser(user), ...tokens };
  }

  async login({ email, password }) {
    const user = await store.findUserByUnique({ email });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update user status to online
    const updatedUser = await store.updateUser(user.id, { status: 'ONLINE' });
    const freshUser = updatedUser || user;

    const tokens = await this.generateTokens(user.id);

    return {
      user: store.sanitizeUser(freshUser),
      ...tokens,
    };
  }

  async refreshToken(refreshToken) {
    const storedToken = await store.findRefreshTokenByToken(refreshToken);

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      await store.deleteRefreshToken(storedToken.id);
      throw new AuthenticationError('Refresh token has expired');
    }

    // Verify the JWT refresh token
    try {
      jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      await store.deleteRefreshToken(storedToken.id);
      throw new AuthenticationError('Invalid refresh token');
    }

    const user = await store.findUserById(storedToken.userId);

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.userId);

    // Delete old refresh token (rotation)
    await store.deleteRefreshToken(storedToken.id);

    return {
      user: store.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Logout user by deleting all refresh tokens.
   */
  async logout(userId) {
    await store.deleteRefreshTokensByUserId(userId);

    await store.updateUser(userId, {
      status: 'OFFLINE',
      lastSeenAt: new Date(),
    });
  }

  /**
   * Generate access and refresh tokens for a user.
   */
  async generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    });

    const refreshToken = jwt.sign({ userId, jti: uuidv4() }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await store.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
