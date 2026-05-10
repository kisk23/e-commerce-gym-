import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260425162000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      do $$
      begin
        if exists (
          select 1
          from information_schema.columns
          where table_name = 'subscription_plan'
            and column_name = 'variant_id'
        ) then
          alter table if exists "subscription_plan" alter column "variant_id" drop not null;
        end if;
      end $$;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      do $$
      begin
        if exists (
          select 1
          from information_schema.columns
          where table_name = 'subscription_plan'
            and column_name = 'variant_id'
        ) then
          alter table if exists "subscription_plan" alter column "variant_id" set not null;
        end if;
      end $$;
    `)
  }
}
