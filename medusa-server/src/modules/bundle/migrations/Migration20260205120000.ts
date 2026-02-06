import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260205120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "bundle" add column if not exists "bundle_type" text null;`
    )
    this.addSql(
      `alter table if exists "bundle" add column if not exists "total_weight" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle" add column if not exists "total_calories" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle" add column if not exists "total_protein" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle" add column if not exists "total_carbs" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle" add column if not exists "total_fat" numeric not null default 0;`
    )

    this.addSql(
      `alter table if exists "bundle_item" add column if not exists "weight" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle_item" add column if not exists "calories" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle_item" add column if not exists "protein" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle_item" add column if not exists "carbs" numeric not null default 0;`
    )
    this.addSql(
      `alter table if exists "bundle_item" add column if not exists "fat" numeric not null default 0;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle_item" drop column if exists "fat";`)
    this.addSql(`alter table if exists "bundle_item" drop column if exists "carbs";`)
    this.addSql(`alter table if exists "bundle_item" drop column if exists "protein";`)
    this.addSql(`alter table if exists "bundle_item" drop column if exists "calories";`)
    this.addSql(`alter table if exists "bundle_item" drop column if exists "weight";`)

    this.addSql(`alter table if exists "bundle" drop column if exists "total_fat";`)
    this.addSql(`alter table if exists "bundle" drop column if exists "total_carbs";`)
    this.addSql(`alter table if exists "bundle" drop column if exists "total_protein";`)
    this.addSql(`alter table if exists "bundle" drop column if exists "total_calories";`)
    this.addSql(`alter table if exists "bundle" drop column if exists "total_weight";`)
    this.addSql(`alter table if exists "bundle" drop column if exists "bundle_type";`)
  }
}
