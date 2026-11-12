import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { GRADES, MAJORS } from './types';

const DATABASE_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'students.db');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS students (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_number   TEXT    NOT NULL UNIQUE,
    first_name    TEXT    NOT NULL,
    last_name     TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    phone         TEXT    NOT NULL,
    date_of_birth TEXT    NOT NULL,
    grade         TEXT    NOT NULL,
    major         TEXT    NOT NULL,
    gpa           REAL    NOT NULL DEFAULT 0,
    status        TEXT    NOT NULL DEFAULT 'active',
    enrolled_on   TEXT    NOT NULL,
    address       TEXT    NOT NULL DEFAULT '',
    notes         TEXT    NOT NULL DEFAULT '',
    created_at    TEXT    NOT NULL,
    updated_at    TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
  CREATE INDEX IF NOT EXISTS idx_students_major ON students (major);
  CREATE INDEX IF NOT EXISTS idx_students_name ON students (last_name, first_name);
`;

interface DatabaseGlobal {
  __studentManagementDb?: Database.Database;
}

interface SeedStudent {
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: string;
  major: string;
  gpa: number;
  status: string;
  enrolledOn: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lazily open (and on first use, seed) the SQLite database.
 *
 * The connection is cached on `globalThis` so it survives Fast Refresh in
 * development instead of opening a new file handle on every reload.
 */
export function getDb(): Database.Database {
  const globalScope = globalThis as unknown as DatabaseGlobal;
  if (globalScope.__studentManagementDb) {
    return globalScope.__studentManagementDb;
  }

  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });

  const db = new Database(DATABASE_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM students')
    .get() as { count: number };

  if (count === 0) {
    seed(db);
  }

  globalScope.__studentManagementDb = db;
  return db;
}

/* -------------------------------------------------------------------------- */
/* Seed data                                                                   */
/* -------------------------------------------------------------------------- */

const FIRST_NAMES = [
  'Amara', 'Noah', 'Sofia', 'Liam', 'Priya', 'Mateo', 'Chen', 'Fatima',
  'Lucas', 'Isabella', 'Omar', 'Emma', 'Kai', 'Aisha', 'Diego', 'Hana',
  'Ethan', 'Leila', 'Marcus', 'Yuki', 'Nina', 'Ravi', 'Elena', 'Jonas',
];

const LAST_NAMES = [
  'Okafor', 'Bennett', 'Rossi', 'Nguyen', 'Sharma', 'Alvarez', 'Wei', 'Haddad',
  'Silva', 'Kowalski', 'Mensah', 'Larsen', 'Tanaka', 'Ibrahim', 'Costa', 'Park',
  'Fischer', 'Novak', 'Duarte', 'Sato', 'Petrov', 'Mehta', 'Lopez', 'Berg',
];

const ENROLLMENT_DATES = [
  '2022-08-22', '2023-01-09', '2023-08-21', '2024-01-08',
  '2024-08-19', '2025-01-13', '2025-08-18', '2026-01-12',
];

/** Deterministic pseudo random generator so seeds are reproducible. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

function buildSeedStudents(total = 64): SeedStudent[] {
  const random = createRandom(20260420);
  const students: SeedStudent[] = [];

  for (let index = 0; index < total; index += 1) {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length] as string;
    const lastName = pick(LAST_NAMES, random);
    const grade = GRADES[Math.floor(random() * GRADES.length)] ?? GRADES[0];
    const major = pick(MAJORS, random);
    const enrolledOn = pick(ENROLLMENT_DATES, random);

    const statusRoll = random();
    const status =
      statusRoll < 0.7
        ? 'active'
        : statusRoll < 0.86
          ? 'graduated'
          : statusRoll < 0.94
            ? 'suspended'
            : 'withdrawn';

    const gpa = Math.round(Math.min(4, 1.9 + random() * 2.2) * 100) / 100;
    const birthYear = 2006 - Math.floor(random() * 5);
    const enrolledTime = Date.parse(`${enrolledOn}T00:00:00.000Z`);
    const createdAt = new Date(
      enrolledTime + Math.floor(random() * 45) * 86_400_000,
    ).toISOString();

    students.push({
      rollNumber: `STU-${2026 - Math.floor(random() * 4)}-${pad(index + 1, 4)}`,
      firstName,
      lastName,
      email: `${firstName}.${lastName}${index + 1}@campus.edu`.toLowerCase(),
      phone: `+1 (555) ${pad(Math.floor(random() * 900) + 100, 3)}-${pad(
        Math.floor(random() * 9000) + 1000,
        4,
      )}`,
      dateOfBirth: `${birthYear}-${pad(Math.floor(random() * 12) + 1)}-${pad(
        Math.floor(random() * 28) + 1,
      )}`,
      grade,
      major,
      gpa,
      status,
      enrolledOn,
      address: `${Math.floor(random() * 900) + 100} ${pick(
        ['Maple', 'Oak', 'Cedar', 'Birch', 'Elm'],
        random,
      )} ${pick(['Street', 'Avenue', 'Lane'], random)}, Springfield`,
      notes: '',
      createdAt,
      updatedAt: createdAt,
    });
  }

  return students;
}

function seed(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT INTO students (
      roll_number, first_name, last_name, email, phone, date_of_birth,
      grade, major, gpa, status, enrolled_on, address, notes,
      created_at, updated_at
    ) VALUES (
      @rollNumber, @firstName, @lastName, @email, @phone, @dateOfBirth,
      @grade, @major, @gpa, @status, @enrolledOn, @address, @notes,
      @createdAt, @updatedAt
    )
  `);

  const insertMany = db.transaction((rows: SeedStudent[]) => {
    for (const row of rows) {
      insert.run(row);
    }
  });

  insertMany(buildSeedStudents());
}

export { DATABASE_PATH };
