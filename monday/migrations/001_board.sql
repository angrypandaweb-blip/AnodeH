create table people (
  stage text not null,
  id text not null,
  name text not null,
  email text not null default '',
  source text not null default 'account',
  sample boolean not null default false,
  seen_at timestamptz not null default now(),
  primary key (stage, id),
  constraint people_source check (source in ('account', 'named')),
  constraint people_name_len check (char_length(name) between 1 and 80)
);

create table board (
  stage text primary key,
  launch_on date,
  seeded boolean not null default false
);

create table ideas (
  stage text not null,
  id text not null,
  title text not null,
  body text not null default '',
  author_id text not null,
  status text not null default 'new',
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (stage, id),
  foreign key (stage, author_id) references people (stage, id),
  constraint ideas_status check (status in ('new', 'discussing', 'accepted', 'parked')),
  constraint ideas_title_len check (char_length(title) between 1 and 140),
  constraint ideas_body_len check (char_length(body) <= 2000)
);

create table meetings (
  stage text not null,
  meets_on date not null,
  notes text not null default '',
  primary key (stage, meets_on),
  constraint meetings_notes_len check (char_length(notes) <= 4000)
);

create table tasks (
  stage text not null,
  id text not null,
  idea_id text,
  title text not null,
  assignee_id text,
  due_on date,
  status text not null default 'todo',
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (stage, id),
  foreign key (stage, idea_id) references ideas (stage, id),
  foreign key (stage, assignee_id) references people (stage, id),
  constraint tasks_status check (status in ('todo', 'doing', 'done')),
  constraint tasks_title_len check (char_length(title) between 1 and 140)
);

create index ideas_stage_created on ideas (stage, created_at desc);
create index tasks_stage_due on tasks (stage, due_on);
