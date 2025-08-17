import { ViewColumn, ViewEntity } from 'typeorm';

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

  @ViewColumn()
  price: string;

  @ViewColumn({ name: 'purchase_price' })
  purchasePrice: string;

  @ViewColumn({ name: 'total_earnings' })
  totalEarnings: string; // DB will compute this
}
