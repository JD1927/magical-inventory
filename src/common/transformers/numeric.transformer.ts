import { ValueTransformer } from 'typeorm';

/**
 * DecimalTransformer ensures that Postgres numeric/decimal
 * values are converted into JavaScript numbers safely.
 */
export class DecimalTransformer implements ValueTransformer {
  to(value: number): number {
    // when saving to the database
    return value;
  }

  from(value: string | null): number {
    // when reading from the database (numeric comes as string)
    return value === null ? 0 : parseFloat(value);
  }
}
