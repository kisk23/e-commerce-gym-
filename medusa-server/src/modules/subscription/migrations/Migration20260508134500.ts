import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260508134500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "customer_subscription" add column if not exists "pricing_segments" text not null default '[]';`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "customer_subscription" drop column if exists "pricing_segments";`
    )
  }
}
