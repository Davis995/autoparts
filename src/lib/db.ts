// Database utilities will be added later
// For now, using sample data for UI development

export const sampleProducts = [
  {
    id: '1',
    name: 'Premium Car Seat Covers',
    description: 'High-quality leather seat covers with extra padding for comfort',
    price: 89.99,
    stock: 15,
    images: ['/images/IMG_3894.JPG'],
    categoryId: '1',
    tags: ['interior', 'comfort', 'premium'],
    isBestSelling: true,
    isTopSelling: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const sampleCategories = [
  {
    id: '1',
    name: 'Interior',
    description: 'Interior accessories',
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];
