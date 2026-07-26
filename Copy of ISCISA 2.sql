CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR,
  "email" VARCHAR UNIQUE,
  "password" VARCHAR,
  "status" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "roles" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "permissions" (
  "id" BIGSERIAL PRIMARY KEY,
  "code" VARCHAR UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "user_roles" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT,
  "role_id" BIGINT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "role_permissions" (
  "id" BIGSERIAL PRIMARY KEY,
  "role_id" BIGINT,
  "permission_id" BIGINT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "organs" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR,
  "type" VARCHAR,
  "description" TEXT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "scientific_areas" (
  "id" BIGSERIAL PRIMARY KEY,
  "organ_id" BIGINT,
  "name" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "courses" (
  "id" BIGSERIAL PRIMARY KEY,
  "scientific_area_id" BIGINT,
  "name" VARCHAR,
  "code" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "teacher_profiles" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT,
  "scientific_area_id" BIGINT,
  "department" VARCHAR,
  "academic_degree" VARCHAR,
  "is_Internal" Bool,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "organ_members" (
  "id" BIGSERIAL PRIMARY KEY,
  "organ_id" BIGINT,
  "user_id" BIGINT,
  "role" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "protocols" (
  "id" BIGSERIAL PRIMARY KEY,
  "student" BIGSERIAL,
  "current_organ_id" BIGINT,
  "topic_id" BIGSERIAL,
  "approved_by_supervisor" BOOLEAN,
  "protocol_type" VARCHAR,
  "submission_number" VARCHAR,
  "status" VARCHAR,
  "version" varchar,
  "submitted_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "protocol_review_assignments" (
  "id" BIGSERIAL PRIMARY KEY,
  "protocol_id" BIGINT,
  "organ_id" BIGINT,
  "reviewer_one" BIGINT,
  "reviewer_two" BIGINT,
  "review_order" bool,
  "status" VARCHAR,
  "assigned_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "protocol_evaluations" (
  "id" BIGSERIAL PRIMARY KEY,
  "assignment_id" BIGINT,
  "decision" VARCHAR,
  "comments" TEXT,
  "accepted_final" BOOLEAN,
  "evaluation_data" JSON,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "student_profiles" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT,
  "course_id" BIGINT,
  "supervisorID" BIGINT,
  "student_number" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "topic_reviews" (
  "id" BIGSERIAL PRIMARY KEY,
  "student_profile_id" BIGINT,
  "title" VARCHAR,
  "description" TEXT,
  "status" VARCHAR,
  "current_version" INT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "topic_review_evaluations" (
  "id" BIGSERIAL PRIMARY KEY,
  "topic_review_id" BIGINT,
  "reviewer_teacher_one" BIGINT,
  "reviewer_teacher_two" BIGINT,
  "decision" VARCHAR,
  "comments" TEXT,
  "version" INT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "admin_profiles" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT,
  "organ_id" BIGINT,
  "access_scope" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "secretary_profiles" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT,
  "organ_id" BIGINT,
  "office" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "coordinator_profiles" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT,
  "scientific_area" BIGINT,
  "course_id" BIGSERIAL,
  "office" VARCHAR,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "documents" (
  "id" BIGSERIAL PRIMARY KEY,
  "submited_by" BIGSERIAL,
  "protocol_id" BIGINT,
  "document_type" VARCHAR,
  "file_name" VARCHAR,
  "file_path" VARCHAR,
  "pages" INT,
  "version" INT,
  "status" varchar,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

ALTER TABLE "user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_permissions" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_permissions" ADD FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "scientific_areas" ADD FOREIGN KEY ("organ_id") REFERENCES "organs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "courses" ADD FOREIGN KEY ("scientific_area_id") REFERENCES "scientific_areas" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "teacher_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "teacher_profiles" ADD FOREIGN KEY ("scientific_area_id") REFERENCES "scientific_areas" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "organ_members" ADD FOREIGN KEY ("organ_id") REFERENCES "organs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "organ_members" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocols" ADD FOREIGN KEY ("student") REFERENCES "student_profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocols" ADD FOREIGN KEY ("current_organ_id") REFERENCES "organs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocols" ADD FOREIGN KEY ("topic_id") REFERENCES "topic_reviews" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocol_review_assignments" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocols" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocol_review_assignments" ADD FOREIGN KEY ("organ_id") REFERENCES "organs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocol_review_assignments" ADD FOREIGN KEY ("reviewer_one") REFERENCES "teacher_profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocol_review_assignments" ADD FOREIGN KEY ("reviewer_two") REFERENCES "teacher_profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "protocol_evaluations" ADD FOREIGN KEY ("assignment_id") REFERENCES "protocol_review_assignments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "student_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "student_profiles" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "student_profiles" ADD FOREIGN KEY ("supervisorID") REFERENCES "teacher_profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "topic_reviews" ADD FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "topic_review_evaluations" ADD FOREIGN KEY ("topic_review_id") REFERENCES "topic_reviews" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "topic_review_evaluations" ADD FOREIGN KEY ("reviewer_teacher_one") REFERENCES "teacher_profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "topic_review_evaluations" ADD FOREIGN KEY ("reviewer_teacher_two") REFERENCES "teacher_profiles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "admin_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "admin_profiles" ADD FOREIGN KEY ("organ_id") REFERENCES "organs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "secretary_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "secretary_profiles" ADD FOREIGN KEY ("organ_id") REFERENCES "organs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "coordinator_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "coordinator_profiles" ADD FOREIGN KEY ("scientific_area") REFERENCES "scientific_areas" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "coordinator_profiles" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "documents" ADD FOREIGN KEY ("submited_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "documents" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocols" ("id") DEFERRABLE INITIALLY IMMEDIATE;
