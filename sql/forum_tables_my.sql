DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users  (
  user_ID INT NOT NULL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  num_messages INT DEFAULT 0
);

INSERT INTO users (user_ID, name, email)
VALUES 
  (0, 'Alex', 'aluchi@bgsu.edu'),
  (1, 'Dasha', 'dfilippova@gmail.com'),
  (2, 'John', 'john@gmail.com')
;

DROP TABLE IF EXISTS forum_messages CASCADE;
CREATE TABLE forum_messages (
  message_ID INT NOT NULL PRIMARY KEY,
  room_ID INT NOT NULL,
  author_ID INT NOT NULL,
  text TEXT,
  date DATE,
  FOREIGN KEY (author_ID) REFERENCES users(user_ID)
);

DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms (
  room_ID INT NOT NULL PRIMARY KEY,
  theme_ID INT NOT NULL,
  topic VARCHAR(100),
  creator_ID INT NOT NULL,
  num_replies INT NOT NULL DEFAULT 0,
  num_visits INT NOT NULL DEFAULT 0,
  last_reply_ID INT NOT NULL,
  FOREIGN KEY (creator_ID) REFERENCES users(user_ID),
  FOREIGN KEY (last_reply_ID) REFERENCES forum_messages(message_ID)
);

DROP TABLE IF EXISTS themes CASCADE;
CREATE TABLE themes (
  theme_ID INT NOT NULL PRIMARY KEY,
  topic TEXT,
  description TEXT,
  creator_ID INT NOT NULL,
  num_themes INT NOT NULL,
  num_replies INT NOT NULL,
  last_reply_ID INT NOT NULL,
  FOREIGN KEY (creator_ID) REFERENCES users(user_ID),
  FOREIGN KEY (last_reply_ID) REFERENCES forum_messages(message_ID)
)