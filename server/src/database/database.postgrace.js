/**
 * PostgreSQL database layer using pg (node-postgres).
 * Replaces the in-memory store with actual PostgreSQL tables.
 * All data is persisted in the database.
 */
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ==================== TABLE INITIALIZATION ====================

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if users table exists to decide between fresh install vs migration
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    const tablesExist = tableCheck.rows[0].exists;

    if (!tablesExist) {
      // First time setup - create all tables fresh
      // Users table
      await client.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          avatar_url TEXT,
          bio TEXT,
          status VARCHAR(50) DEFAULT 'OFFLINE',
          last_seen_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Conversations table
      await client.query(`
        CREATE TABLE conversations (
          id UUID PRIMARY KEY,
          type VARCHAR(50) DEFAULT 'ONE_TO_ONE',
          last_message_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Conversation members table
      await client.query(`
        CREATE TABLE conversation_members (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          joined_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, conversation_id)
        );
      `);

      // Groups table
      await client.query(`
        CREATE TABLE groups_table (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          avatar_url TEXT,
          created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Group members table
      await client.query(`
        CREATE TABLE group_members (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          group_id UUID NOT NULL REFERENCES groups_table(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'MEMBER',
          joined_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, group_id)
        );
      `);

      // Messages table
      await client.query(`
        CREATE TABLE messages (
          id UUID PRIMARY KEY,
          content TEXT,
          type VARCHAR(50) DEFAULT 'TEXT',
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          group_id UUID REFERENCES groups_table(id) ON DELETE CASCADE,
          parent_id UUID REFERENCES messages(id) ON DELETE SET NULL,
          is_edited BOOLEAN DEFAULT FALSE,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Message reads table
      await client.query(`
        CREATE TABLE message_reads (
          id UUID PRIMARY KEY,
          message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          read_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(message_id, user_id)
        );
      `);

      // Refresh tokens table
      await client.query(`
        CREATE TABLE refresh_tokens (
          id UUID PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      console.log('Database tables created successfully');
    } else {
      // Tables exist - run migrations to add any missing columns
      const migrations = [
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) DEFAULT ''`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'OFFLINE'`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP DEFAULT NULL`,
        `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'ONE_TO_ONE'`,
        `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP DEFAULT NULL`,
        `ALTER TABLE groups_table ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL`,
        `ALTER TABLE groups_table ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`,
        `ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'MEMBER'`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'TEXT'`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE`,
      ];
      for (const migration of migrations) {
        try {
          await client.query(migration);
        } catch (err) {
          console.log(`Migration note: ${err.message}`);
        }
      }
      console.log('Database tables verified successfully');
    }

    // Create indexes (idempotent - won't fail if already exist)
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation ON conversation_members(conversation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`,
    ];
    for (const index of indexes) {
      try {
        await client.query(index);
      } catch (err) {
        console.log(`Index note: ${err.message}`);
      }
    }

    await client.query('COMMIT');
    console.log('Database initialization completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// ==================== USER OPERATIONS ====================

async function findUserByUnique(where) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.id) {
    conditions.push(`id = $${index++}`);
    values.push(where.id);
  }
  if (where.email) {
    conditions.push(`email = $${index++}`);
    values.push(where.email);
  }
  if (where.username) {
    conditions.push(`username = $${index++}`);
    values.push(where.username);
  }

  if (conditions.length === 0) return null;

  const query = `SELECT * FROM users WHERE ${conditions.join(' OR ')} LIMIT 1`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
}

async function findUserFirst(where) {
  if (where.OR && Array.isArray(where.OR)) {
    const conditions = [];
    const values = [];
    let index = 1;

    for (const condition of where.OR) {
      const subConditions = [];
      if (condition.email) {
        subConditions.push(`email = $${index++}`);
        values.push(condition.email);
      }
      if (condition.username) {
        subConditions.push(`username = $${index++}`);
        values.push(condition.username);
      }
      if (subConditions.length > 0) {
        conditions.push(`(${subConditions.join(' OR ')})`);
      }
    }

    if (conditions.length > 0) {
      const query = `SELECT * FROM users WHERE ${conditions.join(' OR ')} LIMIT 1`;
      const result = await pool.query(query, values);
      return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
    }
  }
  return null;
}

async function createUser(data) {
  const id = uuidv4();
  const now = new Date();
  const query = `
    INSERT INTO users (id, username, email, password, display_name, avatar_url, bio, status, last_seen_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;
  const values = [
    id,
    data.username,
    data.email,
    data.password,
    data.displayName || data.username,
    data.avatarUrl || null,
    data.bio || null,
    data.status || 'OFFLINE',
    data.lastSeenAt || null,
    now,
    now,
  ];
  const result = await pool.query(query, values);
  return mapUser(result.rows[0]);
}

async function updateUser(id, data) {
  const sets = [];
  const values = [];
  let index = 1;

  if (data.username !== undefined) {
    sets.push(`username = $${index++}`);
    values.push(data.username);
  }
  if (data.email !== undefined) {
    sets.push(`email = $${index++}`);
    values.push(data.email);
  }
  if (data.password !== undefined) {
    sets.push(`password = $${index++}`);
    values.push(data.password);
  }
  if (data.displayName !== undefined) {
    sets.push(`display_name = $${index++}`);
    values.push(data.displayName);
  }
  if (data.avatarUrl !== undefined) {
    sets.push(`avatar_url = $${index++}`);
    values.push(data.avatarUrl);
  }
  if (data.bio !== undefined) {
    sets.push(`bio = $${index++}`);
    values.push(data.bio);
  }
  if (data.status !== undefined) {
    sets.push(`status = $${index++}`);
    values.push(data.status);
  }
  if (data.lastSeenAt !== undefined) {
    sets.push(`last_seen_at = $${index++}`);
    values.push(data.lastSeenAt);
  }

  if (sets.length === 0) return findUserById(id);

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${index} RETURNING *;`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
}

async function findUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
}

async function findUsers(where = {}) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.id) {
    conditions.push(`id = $${index++}`);
    values.push(where.id);
  }
  if (where.email) {
    conditions.push(`email = $${index++}`);
    values.push(where.email);
  }
  if (where.username) {
    conditions.push(`username = $${index++}`);
    values.push(where.username);
  }
  if (where.ids && Array.isArray(where.ids)) {
    const placeholders = where.ids.map(() => `$${index++}`).join(', ');
    conditions.push(`id IN (${placeholders})`);
    values.push(...where.ids);
  }

  const query =
    conditions.length > 0
      ? `SELECT * FROM users WHERE ${conditions.join(' AND ')}`
      : 'SELECT * FROM users';
  const result = await pool.query(query, values);
  return result.rows.map(mapUser);
}

// ==================== CONVERSATION OPERATIONS ====================

async function createConversation(data) {
  const id = uuidv4();
  const now = new Date();
  const query = `
    INSERT INTO conversations (id, type, last_message_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const values = [id, data.type || 'ONE_TO_ONE', data.lastMessageAt || null, now, now];
  const result = await pool.query(query, values);
  return mapConversation(result.rows[0]);
}

async function findConversationFirst(where) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.id) {
    conditions.push(`c.id = $${index++}`);
    values.push(where.id);
  }
  if (where.type) {
    conditions.push(`c.type = $${index++}`);
    values.push(where.type);
  }

  // Handle AND conditions with conversationMembers
  if (where.AND && Array.isArray(where.AND)) {
    for (const condition of where.AND) {
      if (condition.conversationMembers && condition.conversationMembers.some) {
        const userIds = condition.conversationMembers.some
          .filter((c) => c.userId)
          .map((c) => c.userId);

        if (userIds.length > 0) {
          const placeholders = userIds.map(() => `$${index++}`).join(', ');
          conditions.push(`(
            SELECT COUNT(DISTINCT cm.user_id)
            FROM conversation_members cm
            WHERE cm.conversation_id = c.id
            AND cm.user_id IN (${placeholders})
          ) = $${index++}`);
          values.push(...userIds, userIds.length);
        }
      }
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT c.* FROM conversations c ${whereClause} LIMIT 1`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapConversation(result.rows[0]) : null;
}

async function findConversations(where = {}, options = {}) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.conversationMembers && where.conversationMembers.some) {
    const userId = where.conversationMembers.some.userId;
    conditions.push(`c.id IN (
      SELECT cm.conversation_id FROM conversation_members cm WHERE cm.user_id = $${index++}
    )`);
    values.push(userId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let query = `SELECT c.* FROM conversations c ${whereClause} ORDER BY c.last_message_at DESC NULLS LAST`;

  if (options.skip) query += ` OFFSET ${options.skip}`;
  if (options.take) query += ` LIMIT ${options.take}`;

  const result = await pool.query(query, values);
  return result.rows.map(mapConversation);
}

async function countConversations(where = {}) {
  if (where.conversationMembers && where.conversationMembers.some) {
    const userId = where.conversationMembers.some.userId;
    const result = await pool.query(
      'SELECT COUNT(DISTINCT cm.conversation_id) as count FROM conversation_members cm WHERE cm.user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
  const result = await pool.query('SELECT COUNT(*) as count FROM conversations');
  return parseInt(result.rows[0].count, 10);
}

async function updateConversation(id, data) {
  const sets = [];
  const values = [];
  let index = 1;

  if (data.type !== undefined) {
    sets.push(`type = $${index++}`);
    values.push(data.type);
  }
  if (data.lastMessageAt !== undefined) {
    sets.push(`last_message_at = $${index++}`);
    values.push(data.lastMessageAt);
  }

  if (sets.length === 0) return null;

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const query = `UPDATE conversations SET ${sets.join(', ')} WHERE id = $${index} RETURNING *;`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapConversation(result.rows[0]) : null;
}

// ==================== CONVERSATION MEMBER OPERATIONS ====================

async function createConversationMember(data) {
  const id = uuidv4();
  const query = `
    INSERT INTO conversation_members (id, user_id, conversation_id, joined_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id, conversation_id) DO NOTHING
    RETURNING *;
  `;
  const values = [id, data.userId, data.conversationId];
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapConversationMember(result.rows[0]) : null;
}

async function findConversationMember(where) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.userId) {
    conditions.push(`user_id = $${index++}`);
    values.push(where.userId);
  }
  if (where.conversationId) {
    conditions.push(`conversation_id = $${index++}`);
    values.push(where.conversationId);
  }

  if (conditions.length === 0) return null;

  const query = `SELECT * FROM conversation_members WHERE ${conditions.join(' AND ')} LIMIT 1`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapConversationMember(result.rows[0]) : null;
}

async function getConversationMembers(conversationId) {
  const result = await pool.query('SELECT * FROM conversation_members WHERE conversation_id = $1', [
    conversationId,
  ]);
  return result.rows.map(mapConversationMember);
}

async function getUserConversationIds(userId) {
  const result = await pool.query(
    'SELECT conversation_id FROM conversation_members WHERE user_id = $1',
    [userId]
  );
  return new Set(result.rows.map((r) => r.conversation_id));
}

// ==================== GROUP OPERATIONS ====================

async function createGroup(data) {
  const id = uuidv4();
  const now = new Date();
  const query = `
    INSERT INTO groups_table (id, name, description, avatar_url, created_by_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
  `;
  const values = [
    id,
    data.name,
    data.description || null,
    data.avatarUrl || null,
    data.createdById,
    now,
    now,
  ];
  const result = await pool.query(query, values);
  return mapGroup(result.rows[0]);
}

async function findGroupById(id) {
  const result = await pool.query('SELECT * FROM groups_table WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapGroup(result.rows[0]) : null;
}

async function findGroups(where = {}) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.id) {
    conditions.push(`id = $${index++}`);
    values.push(where.id);
  }
  if (where.createdById) {
    conditions.push(`created_by_id = $${index++}`);
    values.push(where.createdById);
  }

  const query =
    conditions.length > 0
      ? `SELECT * FROM groups_table WHERE ${conditions.join(' AND ')}`
      : 'SELECT * FROM groups_table';
  const result = await pool.query(query, values);
  return result.rows.map(mapGroup);
}

async function updateGroup(id, data) {
  const sets = [];
  const values = [];
  let index = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${index++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    sets.push(`description = $${index++}`);
    values.push(data.description);
  }
  if (data.avatarUrl !== undefined) {
    sets.push(`avatar_url = $${index++}`);
    values.push(data.avatarUrl);
  }

  if (sets.length === 0) return findGroupById(id);

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const query = `UPDATE groups_table SET ${sets.join(', ')} WHERE id = $${index} RETURNING *;`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapGroup(result.rows[0]) : null;
}

// ==================== GROUP MEMBER OPERATIONS ====================

async function createGroupMember(data) {
  const id = uuidv4();
  const query = `
    INSERT INTO group_members (id, user_id, group_id, role, joined_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id, group_id) DO UPDATE SET role = $4
    RETURNING *;
  `;
  const values = [id, data.userId, data.groupId, data.role || 'MEMBER'];
  const result = await pool.query(query, values);
  return mapGroupMember(result.rows[0]);
}

async function findGroupMember(where) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.userId) {
    conditions.push(`user_id = $${index++}`);
    values.push(where.userId);
  }
  if (where.groupId) {
    conditions.push(`group_id = $${index++}`);
    values.push(where.groupId);
  }

  if (conditions.length === 0) return null;

  const query = `SELECT * FROM group_members WHERE ${conditions.join(' AND ')} LIMIT 1`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapGroupMember(result.rows[0]) : null;
}

async function getGroupMembers(groupId) {
  const result = await pool.query('SELECT * FROM group_members WHERE group_id = $1', [groupId]);
  return result.rows.map(mapGroupMember);
}

async function getUserGroupIds(userId) {
  const result = await pool.query('SELECT group_id FROM group_members WHERE user_id = $1', [
    userId,
  ]);
  return new Set(result.rows.map((r) => r.group_id));
}

async function deleteGroupMember(userId, groupId) {
  await pool.query('DELETE FROM group_members WHERE user_id = $1 AND group_id = $2', [
    userId,
    groupId,
  ]);
}

// ==================== MESSAGE OPERATIONS ====================

async function createMessage(data) {
  const id = uuidv4();
  const now = new Date();
  const query = `
    INSERT INTO messages (id, content, type, sender_id, conversation_id, group_id, parent_id, is_edited, is_deleted, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
  `;
  const values = [
    id,
    data.content || null,
    data.type || 'TEXT',
    data.senderId,
    data.conversationId || null,
    data.groupId || null,
    data.parentId || null,
    false,
    false,
    now,
    now,
  ];
  const result = await pool.query(query, values);
  return mapMessage(result.rows[0]);
}

async function findMessageById(id) {
  const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapMessage(result.rows[0]) : null;
}

async function findMessages(where = {}, options = {}) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (where.conversationId) {
    conditions.push(`conversation_id = $${index++}`);
    values.push(where.conversationId);
  }
  if (where.groupId) {
    conditions.push(`group_id = $${index++}`);
    values.push(where.groupId);
  }
  if (where.isDeleted !== undefined) {
    conditions.push(`is_deleted = $${index++}`);
    values.push(where.isDeleted);
  }
  if (where.id && where.id.in && Array.isArray(where.id.in)) {
    const placeholders = where.id.in.map(() => `$${index++}`).join(', ');
    conditions.push(`id IN (${placeholders})`);
    values.push(...where.id.in);
  }
  if (where.createdAt && where.createdAt.lt) {
    conditions.push(`created_at < $${index++}`);
    values.push(where.createdAt.lt);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  let query = `SELECT * FROM messages ${whereClause} ORDER BY created_at DESC`;

  if (options.take) query += ` LIMIT ${options.take}`;

  const result = await pool.query(query, values);
  return result.rows.map(mapMessage);
}

async function updateMessage(id, data) {
  const sets = [];
  const values = [];
  let index = 1;

  if (data.content !== undefined) {
    sets.push(`content = $${index++}`);
    values.push(data.content);
  }
  if (data.type !== undefined) {
    sets.push(`type = $${index++}`);
    values.push(data.type);
  }
  if (data.isEdited !== undefined) {
    sets.push(`is_edited = $${index++}`);
    values.push(data.isEdited);
  }
  if (data.isDeleted !== undefined) {
    sets.push(`is_deleted = $${index++}`);
    values.push(data.isDeleted);
  }

  if (sets.length === 0) return findMessageById(id);

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const query = `UPDATE messages SET ${sets.join(', ')} WHERE id = $${index} RETURNING *;`;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapMessage(result.rows[0]) : null;
}

// ==================== MESSAGE READ OPERATIONS ====================

async function createMessageRead(data) {
  const id = uuidv4();
  const query = `
    INSERT INTO message_reads (id, message_id, user_id, read_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (message_id, user_id) DO NOTHING
    RETURNING *;
  `;
  const values = [id, data.messageId, data.userId];
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? mapMessageRead(result.rows[0]) : null;
}

async function createManyMessageReads(reads) {
  const results = [];
  for (const data of reads) {
    const read = await createMessageRead(data);
    if (read) results.push(read);
  }
  return results;
}

async function getMessageReads(messageId) {
  const result = await pool.query('SELECT * FROM message_reads WHERE message_id = $1', [messageId]);
  return result.rows.map(mapMessageRead);
}

// ==================== REFRESH TOKEN OPERATIONS ====================

async function createRefreshToken(data) {
  const id = uuidv4();
  const query = `
    INSERT INTO refresh_tokens (id, token, user_id, expires_at, created_at)
    VALUES ($1, $2, $3, $4, NOW()) RETURNING *;
  `;
  const values = [id, data.token, data.userId, data.expiresAt];
  const result = await pool.query(query, values);
  return mapRefreshToken(result.rows[0]);
}

async function findRefreshTokenByToken(tokenStr) {
  const result = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [tokenStr]);
  return result.rows.length > 0 ? mapRefreshToken(result.rows[0]) : null;
}

async function deleteRefreshToken(id) {
  const result = await pool.query('DELETE FROM refresh_tokens WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

async function deleteRefreshTokensByUserId(userId) {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

// ==================== UTILITY ====================

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// ==================== MAPPER FUNCTIONS ====================

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    status: row.status,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapConversation(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapConversationMember(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    conversationId: row.conversation_id,
    joinedAt: row.joined_at,
  };
}

function mapGroup(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    avatarUrl: row.avatar_url,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGroupMember(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    content: row.content,
    type: row.type,
    senderId: row.sender_id,
    conversationId: row.conversation_id,
    groupId: row.group_id,
    parentId: row.parent_id,
    isEdited: row.is_edited,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRead(row) {
  if (!row) return null;
  return {
    id: row.id,
    messageId: row.message_id,
    userId: row.user_id,
    readAt: row.read_at,
  };
}

function mapRefreshToken(row) {
  if (!row) return null;
  return {
    id: row.id,
    token: row.token,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

// ==================== EXPORTS ====================

module.exports = {
  pool,
  initializeDatabase,
  // User operations
  findUserByUnique,
  findUserFirst,
  createUser,
  updateUser,
  findUserById,
  findUsers,
  // Conversation operations
  createConversation,
  findConversationFirst,
  findConversations,
  countConversations,
  updateConversation,
  // Conversation member operations
  createConversationMember,
  findConversationMember,
  getConversationMembers,
  getUserConversationIds,
  // Group operations
  createGroup,
  findGroupById,
  findGroups,
  updateGroup,
  // Group member operations
  createGroupMember,
  findGroupMember,
  getGroupMembers,
  getUserGroupIds,
  deleteGroupMember,
  // Message operations
  createMessage,
  findMessageById,
  findMessages,
  updateMessage,
  // Message read operations
  createMessageRead,
  createManyMessageReads,
  getMessageReads,
  // Refresh token operations
  createRefreshToken,
  findRefreshTokenByToken,
  deleteRefreshToken,
  deleteRefreshTokensByUserId,
  // Utility
  sanitizeUser,
  // Expose users Map for backward compatibility (auth.service login iterates store.users.values())
  users: {
    values() {
      throw new Error(
        'Direct access to users Map is not supported with PostgreSQL. Use findUserByUnique or findUsers instead.'
      );
    },
  },
};
