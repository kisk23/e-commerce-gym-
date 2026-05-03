import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260503130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "subscription_plan" add column if not exists "price_amount" integer not null default 0;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "subscription_plan" drop column if exists "price_amount";`
    )
  }
}
