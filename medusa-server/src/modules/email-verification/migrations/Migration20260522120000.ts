import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260522120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "email_verification" ("id" text not null, "customer_id" text not null, "email" text not null, "status" text not null, "token_hash" text null, "token_expires_at" text null, "last_sent_at" text null, "verified_at" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "email_verification_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_verification_customer_id" ON "email_verification" ("customer_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_verification_token_hash" ON "email_verification" ("token_hash") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_verification_status" ON "email_verification" ("status") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_verification_deleted_at" ON "email_verification" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "email_verification" cascade;`)
  }
}
