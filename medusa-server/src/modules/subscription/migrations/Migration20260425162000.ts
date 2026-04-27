import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260425162000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "subscription_plan" alter column "variant_id" drop not null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "subscription_plan" alter column "variant_id" set not null;`)
  }
}

