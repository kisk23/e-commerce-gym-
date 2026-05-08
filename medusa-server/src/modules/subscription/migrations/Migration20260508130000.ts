import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260508130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      do $$
      begin
        if exists (
          select 1
          from information_schema.columns
          where table_name = 'customer_subscription'
            and column_name = 'discount_percentage'
        ) then
          alter table if exists "customer_subscription"
          alter column "discount_percentage" type double precision
          using "discount_percentage"::double precision;
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
          where table_name = 'customer_subscription'
            and column_name = 'discount_percentage'
        ) then
          alter table if exists "customer_subscription"
          alter column "discount_percentage" type integer
          using round("discount_percentage")::integer;
        end if;
      end $$;
    `)
  }
}
