import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260206093000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "bundle" add column if not exists "total_price" numeric not null default 0;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" drop column if exists "total_price";`)
  }
}
