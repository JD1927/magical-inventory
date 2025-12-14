import { faker } from '@faker-js/faker';

interface SeedSupplier {
  name: string;
  description: string;
  nit: string;
  address: string;
  contactNumber: string;
  email: string;
}

interface SeedCategory {
  name: string;
  description: string;
  isMain: boolean;
}

interface SeedProduct {
  name: string;
  description: string;
  minStock: number;
  isActive: boolean;
}

interface SeedInInventoryMovement {
  quantity: number;
  purchasePrice: number;
  profitMarginPercentage: number;
}

interface SeedOutInventoryMovement {
  quantity: number;
  discountPercent: number;
}

interface SeedData {
  suppliers: SeedSupplier[];
  categories: SeedCategory[];
  products: SeedProduct[];
  inInventoryMovements: SeedInInventoryMovement[];
  outInventoryMovements: SeedOutInventoryMovement[];
}

const createSupplierDto = (): SeedSupplier => {
  return {
    name: faker.company.name(),
    description: faker.company.catchPhraseDescriptor(),
    nit: faker.number.int(10).toString(),
    address: faker.location.streetAddress(),
    contactNumber: faker.phone.number(),
    email: faker.internet.email(),
  };
};

const createCategoryDto = (): SeedCategory => {
  return {
    name: faker.commerce.productMaterial(),
    description: faker.company.buzzPhrase(),
    isMain: faker.datatype.boolean(),
  };
};

const createProductDto = (): SeedProduct => {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    minStock: faker.number.int({ min: 1, max: 5 }),
    isActive: true,
  };
};

const createInInventoryMovementDto = (): SeedInInventoryMovement => {
  return {
    quantity: faker.number.int({ min: 50, max: 100 }),
    purchasePrice: faker.number.float({ min: 5000, max: 10000 }),
    profitMarginPercentage: faker.number.int({ min: 100, max: 300 }),
  };
};

const createOutInventoryMovementDto = (): SeedOutInventoryMovement => {
  return {
    quantity: faker.number.int({ min: 3, max: 10 }),
    discountPercent: faker.number.int({ min: 0, max: 100 }),
  };
};

export const INITIAL_DATA: SeedData = {
  suppliers: faker.helpers.multiple(createSupplierDto, { count: 3 }),
  categories: faker.helpers
    .multiple(createCategoryDto, { count: 2 })
    .map((category, index) => ({
      ...category,
      isMain: index === 0,
    })),
  products: faker.helpers.multiple(createProductDto, { count: 10 }),
  inInventoryMovements: faker.helpers.multiple(createInInventoryMovementDto, {
    count: 10,
  }),
  outInventoryMovements: faker.helpers.multiple(createOutInventoryMovementDto, {
    count: 4,
  }),
};
