# Data Models

This schema is defined in DBML (Database Markup Language) and can be visualized at dbdiagram.io.

```dbml
// DBML for The Agentic Starter Template
// Generated for visualization on dbdiagram.io

Table users {
  _id id [primary key]
  name string
  email string [unique, not null]
  profile_image_url string [note: 'Optional URL for user avatar']
  role string [not null, default: '"user"']
  _creationTime timestamp
}

Table chat_sessions {
  _id id [primary key]
  user_id id [not null]
  title string [note: 'Can be auto-generated from the first message']
  _creationTime timestamp
}

Table chat_messages {
  _id id [primary key]
  session_id id [not null]
  user_id id [not null, note: 'Denormalized for easier querying of user messages']
  role string [not null, note: '"user" or "assistant"']
  content text [not null]
  _creationTime timestamp
}

Table log_entries {
  _id id [primary key]
  correlation_id string [not null]
  user_id id [note: 'Nullable, for system/agent logs']
  level string [not null, note: '"INFO", "WARN", "ERROR", "DEBUG"']
  message text [not null]
  source string [not null, note: '"client", "worker", "convex", "agent"']
  context object [note: 'Flexible field for additional structured data']
  _creationTime timestamp
}

// --- Relationships ---
Ref: users._id < chat_sessions.user_id
Ref: chat_sessions._id < chat_messages.session_id
Ref: users._id < chat_messages.user_id
Ref: users._id < log_entries.user_id
```
