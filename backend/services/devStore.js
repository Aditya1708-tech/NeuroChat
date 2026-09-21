import bcrypt from 'bcryptjs';
import { isDbConnected } from '../config/db.js';

// In-memory data store for local development when MongoDB service is offline
const users = new Map();
const conversations = new Map();
const messages = new Map();

function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machine = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const pid = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return (timestamp + machine + pid + counter).toLowerCase();
}

// Pre-seed demo user for frictionless evaluation & testing
const demoId = '6510a0000000000000000001';
const demoHash = bcrypt.hashSync('Password123!', 10);


// ---------------- User Store ----------------
class DevUserInstance {
  constructor(data) {
    this._id = data._id || generateObjectId();
    this.id = this._id.toString();
    this.name = data.name || '';
    this.email = (data.email || '').toLowerCase();
    this.passwordHash = data.passwordHash || '';
    this.authProviders = data.authProviders || ['local'];
    this.googleId = data.googleId || undefined;
    this.emailVerified = data.emailVerified ?? false;
    this.avatarUrl = data.avatarUrl || '';
    this.settings = {
      uiLanguage: 'en',
      replyLanguage: 'auto',
      theme: 'light',
      onboardingCompleted: false,
      ...(data.settings || {}),
    };
    this.tokenVersion = data.tokenVersion || 0;
    this.lastLoginAt = data.lastLoginAt || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    users.set(this._id.toString(), this);
    return this;
  }

  toJSON() {
    return {
      id: this._id.toString(),
      name: this.name,
      email: this.email,
      authProviders: this.authProviders,
      emailVerified: this.emailVerified,
      avatarUrl: this.avatarUrl,
      settings: { ...this.settings },
      tokenVersion: this.tokenVersion,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Populate pre-seeded demo user
users.set(
  demoId,
  new DevUserInstance({
    _id: demoId,
    name: 'Demo Student',
    email: 'demo@neurochat.ai',
    passwordHash: demoHash,
    emailVerified: true,
  })
);

export const DevUser = {
  async create(data) {
    const instance = new DevUserInstance(data);
    users.set(instance._id.toString(), instance);
    return instance;
  },

  findOne(query) {
    let result = null;
    const normalizedEmail = query.email ? query.email.toLowerCase() : null;

    for (const user of users.values()) {
      if (normalizedEmail && user.email === normalizedEmail) {
        result = user;
        break;
      }
      if (query.googleId && user.googleId === query.googleId) {
        result = user;
        break;
      }
      if (query._id && user._id.toString() === query._id.toString()) {
        result = user;
        break;
      }
    }

    const chain = Promise.resolve(result);
    chain.select = () => chain;
    chain.lean = () => chain;
    return chain;
  },

  findById(id) {
    const user = users.get(id ? id.toString() : '');
    const chain = Promise.resolve(user || null);
    chain.select = () => chain;
    chain.lean = () => chain;
    return chain;
  },
};

// ---------------- Conversation Store ----------------
class DevConversationInstance {
  constructor(data) {
    this._id = data._id || generateObjectId();
    this.id = this._id.toString();
    this.userId = data.userId ? data.userId.toString() : '';
    this.title = data.title || 'New chat';
    this.summary = data.summary || undefined;
    this.summarizedUntil = data.summarizedUntil || undefined;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    conversations.set(this._id.toString(), this);
    return this;
  }

  toJSON() {
    return {
      id: this._id.toString(),
      userId: this.userId,
      title: this.title,
      summary: this.summary,
      summarizedUntil: this.summarizedUntil,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export const DevConversation = {
  async create(data) {
    const instance = new DevConversationInstance(data);
    conversations.set(instance._id.toString(), instance);
    return instance;
  },

  find(query = {}) {
    let list = Array.from(conversations.values());

    if (query.userId) {
      const uid = query.userId.toString();
      list = list.filter((c) => c.userId === uid);
    }

    if (query.title && query.title.$regex) {
      const regex = new RegExp(query.title.$regex, query.title.$options || 'i');
      list = list.filter((c) => regex.test(c.title));
    }

    if (query.updatedAt && query.updatedAt.$lt) {
      const ltDate = new Date(query.updatedAt.$lt);
      list = list.filter((c) => new Date(c.updatedAt) < ltDate);
    }

    const chain = {
      _list: list,
      sort(sortObj = {}) {
        this._list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return this;
      },
      skip(count = 0) {
        this._list = this._list.slice(count);
        return this;
      },
      limit(count = 50) {
        this._list = this._list.slice(0, count);
        return this;
      },
      lean() {
        return this;
      },
      select() {
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve(this._list).then(resolve, reject);
      },
    };

    return chain;
  },

  async findOne(query) {
    const list = Array.from(conversations.values());
    const conv = list.find((c) => {
      const idMatch = !query._id || c._id.toString() === query._id.toString();
      const userMatch = !query.userId || c.userId === query.userId.toString();
      return idMatch && userMatch;
    });
    return conv || null;
  },

  async findById(id) {
    return conversations.get(id ? id.toString() : '') || null;
  },

  async countDocuments(query = {}) {
    let list = Array.from(conversations.values());
    if (query.userId) {
      const uid = query.userId.toString();
      list = list.filter((c) => c.userId === uid);
    }
    return list.length;
  },

  async deleteOne(query) {
    if (query._id) {
      conversations.delete(query._id.toString());
    }
    return { deletedCount: 1 };
  },
};

// ---------------- Message Store ----------------
class DevMessageInstance {
  constructor(data) {
    this._id = data._id || generateObjectId();
    this.id = this._id.toString();
    this.conversationId = data.conversationId ? data.conversationId.toString() : '';
    this.userId = data.userId ? data.userId.toString() : '';
    this.role = data.role || 'user';
    this.content = data.content || '';
    this.metadata = data.metadata || {
      model: 'gemini-1.5-flash',
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      sensitiveTopic: false,
    };
    this.createdAt = data.createdAt || new Date();
  }

  async save() {
    messages.set(this._id.toString(), this);
    return this;
  }

  toJSON() {
    return {
      id: this._id.toString(),
      conversationId: this.conversationId,
      userId: this.userId,
      role: this.role,
      content: this.content,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}

export const DevMessage = {
  async create(data) {
    const instance = new DevMessageInstance(data);
    messages.set(instance._id.toString(), instance);
    return instance;
  },

  find(query = {}) {
    let list = Array.from(messages.values());

    if (query.conversationId) {
      const cid = query.conversationId.toString();
      list = list.filter((m) => m.conversationId === cid);
    }

    if (query.userId) {
      const uid = query.userId.toString();
      list = list.filter((m) => m.userId === uid);
    }

    if (query._id && query._id.$ne) {
      const neId = query._id.$ne.toString();
      list = list.filter((m) => m._id.toString() !== neId);
    }

    if (query._id && query._id.$lt) {
      const ltId = query._id.$lt.toString();
      list = list.filter((m) => m._id.toString() < ltId);
    }

    const chain = {
      _list: list,
      sort(sortObj = {}) {
        if (sortObj._id === -1 || sortObj.createdAt === -1) {
          this._list.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));
        } else {
          this._list.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
        }
        return this;
      },
      limit(count = 50) {
        this._list = this._list.slice(0, count);
        return this;
      },
      lean() {
        return this;
      },
      select() {
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve(this._list).then(resolve, reject);
      },
    };

    return chain;
  },

  findOne(query = {}) {
    let list = Array.from(messages.values());

    if (query.conversationId) {
      const cid = query.conversationId.toString();
      list = list.filter((m) => m.conversationId === cid);
    }
    if (query.userId) {
      const uid = query.userId.toString();
      list = list.filter((m) => m.userId === uid);
    }

    const chain = {
      _list: list,
      sort(sortObj = {}) {
        if (sortObj._id === -1) {
          this._list.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));
        }
        return this;
      },
      lean() {
        return this;
      },
      select() {
        return this;
      },
      then(resolve, reject) {
        const item = this._list[0] || null;
        return Promise.resolve(item).then(resolve, reject);
      },
    };

    return chain;
  },

  async countDocuments(query = {}) {
    let list = Array.from(messages.values());
    if (query.conversationId) {
      const cid = query.conversationId.toString();
      list = list.filter((m) => m.conversationId === cid);
    }
    if (query.userId) {
      const uid = query.userId.toString();
      list = list.filter((m) => m.userId === uid);
    }
    return list.length;
  },

  async deleteMany(query = {}) {
    let deletedCount = 0;
    for (const [id, msg] of messages.entries()) {
      let match = true;
      if (query.conversationId && msg.conversationId !== query.conversationId.toString()) {
        match = false;
      }
      if (query.userId && msg.userId !== query.userId.toString()) {
        match = false;
      }
      if (match) {
        messages.delete(id);
        deletedCount++;
      }
    }
    return { deletedCount };
  },
};
