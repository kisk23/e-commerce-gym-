import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260425154000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "title" text not null default 'Plan';`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "description" text null;`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "duration_months" integer not null default 1;`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "discount_percentage" integer not null default 0;`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "rank" integer not null default 0;`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "is_active" boolean not null default true;`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "created_at" timestamptz not null default now();`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "updated_at" timestamptz not null default now();`)
    this.addSql(`alter table if exists "subscription_plan" add column if not exists "deleted_at" timestamptz null;`)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_plan_deleted_at" ON "subscription_plan" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`alter table if exists "customer_subscription" add column if not exists "customer_id" text not null default '';`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "status" text not null default 'active';`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "plan_title" text not null default 'Plan';`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "duration_months" integer not null default 1;`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "discount_percentage" integer not null default 0;`)
    this.addSql(
      `alter table if exists "customer_subscription" add column if not exists "starts_at" text not null default now()::text;`
    )
    this.addSql(
      `alter table if exists "customer_subscription" add column if not exists "ends_at" text not null default now()::text;`
    )
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "cancelled_at" text null;`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "plan_id" text null;`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "created_at" timestamptz not null default now();`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "updated_at" timestamptz not null default now();`)
    this.addSql(`alter table if exists "customer_subscription" add column if not exists "deleted_at" timestamptz null;`)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_subscription_customer_id" ON "customer_subscription" ("customer_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_subscription_status" ON "customer_subscription" ("status") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_subscription_plan_id" ON "customer_subscription" ("plan_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_subscription_deleted_at" ON "customer_subscription" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `alter table if exists "customer_subscription" drop constraint if exists "customer_subscription_plan_id_foreign";`
    )
    this.addSql(
      `alter table if exists "customer_subscription" add constraint "customer_subscription_plan_id_foreign" foreign key ("plan_id") references "subscription_plan" ("id") on update cascade;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "customer_subscription" drop constraint if exists "customer_subscription_plan_id_foreign";`
    )
  }
}
