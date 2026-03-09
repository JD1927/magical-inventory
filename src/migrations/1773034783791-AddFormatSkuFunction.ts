import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormatSkuFunction1773034783791 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION format_sku(sku_string TEXT)
            RETURNS TEXT AS $$
            DECLARE
                parts TEXT[];
                num_parts INT;
            BEGIN
                IF sku_string IS NULL OR sku_string = '' THEN
                    RETURN sku_string;
                END IF;

                parts := string_to_array(sku_string, '-');
                num_parts := array_length(parts, 1);

                -- If there are fewer than 3 segments, return the original string
                IF num_parts < 3 THEN
                    RETURN sku_string;
                END IF;

                -- Concatenate the first and last segments
                RETURN parts[1] || '-' || parts[num_parts];
            END;
            $$ LANGUAGE plpgsql;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP FUNCTION IF EXISTS format_sku(TEXT);');
    }

}
