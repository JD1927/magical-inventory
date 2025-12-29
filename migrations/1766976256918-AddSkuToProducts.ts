import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkuToProducts1766976256918 implements MigrationInterface {
  name = 'AddSkuToProducts1766976256918';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid extension exists for generating unique fragments
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Add column as nullable first so we can populate unique values for existing rows
    await queryRunner.query(`ALTER TABLE "products" ADD "sku" text`);

    // Populate sku for existing rows with a unique value composed of initials + uuid fragment
    await queryRunner.query(`
      UPDATE "products" SET "sku" = 'KND-XXX-' || gen_random_uuid()
      WHERE "sku" IS NULL OR "sku" = ''
    `);

    // Make column NOT NULL and add unique constraint
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "sku" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sku"`);
    // Note: we do not drop the uuid-ossp extension because it might be used elsewhere
  }
}
