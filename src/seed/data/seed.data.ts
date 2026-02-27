import type { Faker } from '@faker-js/faker';

export interface SeedSupplier {
  name: string;
  description: string;
  nit: string;
  address: string;
  contactNumber: string;
  email: string;
}

export interface SeedCategory {
  name: string;
  description: string;
  isMain: boolean;
}

export interface SeedProduct {
  name: string;
  description: string;
  minStock: number;
  isActive: boolean;
}

export interface SeedInInventoryMovement {
  quantity: number;
  purchasePrice: number;
  profitMarginPercentage: number;
}

export interface SeedOutInventoryMovement {
  quantity: number;
  discountPercent: number;
}

export interface SeedData {
  suppliers: SeedSupplier[];
  categories: SeedCategory[];
  products: SeedProduct[];
}

export const createSupplierDto = (faker: Faker): SeedSupplier => {
  return {
    name: faker.company.name(),
    description: faker.company.catchPhraseDescriptor(),
    nit: faker.number.int({ min: 100000000, max: 999999999 }).toString(),
    address: faker.location.streetAddress(),
    contactNumber: faker.number
      .int({ min: 300000000, max: 399999999 })
      .toString(),
    email: faker.internet.email(),
  };
};

export const createCategoryDto = (faker: Faker): SeedCategory => {
  return {
    name: `${faker.commerce.productMaterial()} ${faker.commerce.productAdjective()}`,
    description: faker.company.buzzPhrase(),
    isMain: faker.datatype.boolean(),
  };
};

export const createProductDto = (faker: Faker): SeedProduct => {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    minStock: faker.number.int({ min: 1, max: 5 }),
    isActive: true,
  };
};

export const createInInventoryMovementDto = (
  faker: Faker,
): SeedInInventoryMovement => {
  return {
    quantity: faker.number.int({ min: 50, max: 100 }),
    purchasePrice: faker.number.float({ min: 5000, max: 10000 }),
    profitMarginPercentage: faker.number.int({ min: 100, max: 300 }),
  };
};

export const createOutInventoryMovementDto = (
  faker: Faker,
): SeedOutInventoryMovement => {
  return {
    quantity: faker.number.int({ min: 3, max: 10 }),
    discountPercent: faker.number.int({ min: 0, max: 100 }),
  };
};

export const getInitialData = (faker: Faker): SeedData => {
  return {
    suppliers: faker.helpers.multiple(() => createSupplierDto(faker), {
      count: 3,
    }),
    categories: faker.helpers
      .multiple(() => createCategoryDto(faker), { count: 2 })
      .map((category, index) => ({
        ...category,
        isMain: index === 0,
      })),
    products: faker.helpers.multiple(() => createProductDto(faker), {
      count: 30,
    }),
  };
};
