import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260604120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "email_verification" add column if not exists "redirect_url" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "email_verification" drop column if exists "redirect_url";`
    )
  }
}
