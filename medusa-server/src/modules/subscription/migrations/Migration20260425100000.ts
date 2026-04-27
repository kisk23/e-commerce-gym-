import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260425100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "subscription_plan" ("id" text not null, "title" text not null, "description" text null, "duration_months" integer not null, "discount_percentage" integer not null, "rank" integer not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_plan_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_plan_deleted_at" ON "subscription_plan" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "customer_subscription" ("id" text not null, "customer_id" text not null, "status" text not null, "plan_title" text not null, "duration_months" integer not null, "discount_percentage" integer not null, "starts_at" text not null, "ends_at" text not null, "cancelled_at" text null, "plan_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customer_subscription_pkey" primary key ("id"));`
    )
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
      `alter table if exists "customer_subscription" add constraint "customer_subscription_plan_id_foreign" foreign key ("plan_id") references "subscription_plan" ("id") on update cascade;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "customer_subscription" drop constraint if exists "customer_subscription_plan_id_foreign";`
    )

    this.addSql(`drop table if exists "subscription_plan" cascade;`)
    this.addSql(`drop table if exists "customer_subscription" cascade;`)
  }
}

