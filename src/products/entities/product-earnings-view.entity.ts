import { ViewColumn, ViewEntity } from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/numeric.transformer';

@ViewEntity({
  name: 'product_with_earnings',
  expression: `
    SELECT
    p.id,
    p.name,
    p.price,
    p.purchase_price,
    (p.price - p.purchase_price) AS total_earnings
    FROM products p
  `,
})
export class ProductWithEarnings {
  @ViewColumn()
  id: string;

  @ViewColumn()
  name: string;

  @ViewColumn({
    transformer: new DecimalTransformer(),
  })
  price: number;

  @ViewColumn({
    name: 'purchase_price',
    transformer: new DecimalTransformer(),
  })
  purchasePrice: number;

  @ViewColumn({
    name: 'total_earnings',
    transformer: new DecimalTransformer(),
  })
  totalEarnings: number; // DB will compute this
}
