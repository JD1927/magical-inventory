import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateExistingSkus1773035186464 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('UPDATE products SET sku = format_sku(sku);');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Warning: Reverting this migration won't restore the original middle segments of the SKUs
        // as that information is effectively removed by the format_sku function.
    }

}
