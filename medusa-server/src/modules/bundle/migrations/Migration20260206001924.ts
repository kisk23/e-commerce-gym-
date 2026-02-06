import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260206001924 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle" alter column "total_weight" type integer using ("total_weight"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "total_calories" type integer using ("total_calories"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "total_protein" type integer using ("total_protein"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "total_carbs" type integer using ("total_carbs"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "total_fat" type integer using ("total_fat"::integer);`);

    this.addSql(`alter table if exists "bundle_item" drop column if exists "quantity";`);

    this.addSql(`alter table if exists "bundle_item" alter column "weight" type integer using ("weight"::integer);`);
    this.addSql(`alter table if exists "bundle_item" alter column "calories" type integer using ("calories"::integer);`);
    this.addSql(`alter table if exists "bundle_item" alter column "protein" type integer using ("protein"::integer);`);
    this.addSql(`alter table if exists "bundle_item" alter column "carbs" type integer using ("carbs"::integer);`);
    this.addSql(`alter table if exists "bundle_item" alter column "fat" type integer using ("fat"::integer);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" alter column "total_weight" type numeric using ("total_weight"::numeric);`);
    this.addSql(`alter table if exists "bundle" alter column "total_calories" type numeric using ("total_calories"::numeric);`);
    this.addSql(`alter table if exists "bundle" alter column "total_protein" type numeric using ("total_protein"::numeric);`);
    this.addSql(`alter table if exists "bundle" alter column "total_carbs" type numeric using ("total_carbs"::numeric);`);
    this.addSql(`alter table if exists "bundle" alter column "total_fat" type numeric using ("total_fat"::numeric);`);

    this.addSql(`alter table if exists "bundle_item" add column if not exists "quantity" integer not null default 1;`);
    this.addSql(`alter table if exists "bundle_item" alter column "weight" type numeric using ("weight"::numeric);`);
    this.addSql(`alter table if exists "bundle_item" alter column "calories" type numeric using ("calories"::numeric);`);
    this.addSql(`alter table if exists "bundle_item" alter column "protein" type numeric using ("protein"::numeric);`);
    this.addSql(`alter table if exists "bundle_item" alter column "carbs" type numeric using ("carbs"::numeric);`);
    this.addSql(`alter table if exists "bundle_item" alter column "fat" type numeric using ("fat"::numeric);`);
  }

}
