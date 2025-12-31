# Admin Portal Endpoints

## Main Admin Routes

| Endpoint | Purpose | Key Features |
|----------|---------|--------------|
| `/admin` | Dashboard | Stats, quick actions, recent orders |
| `/admin/products` | Product Management | CRUD, search, stock, status toggles |
| `/admin/categories` | Category Management | CRUD, product counts, activation |
| `/admin/promotions` | Promotions & Banners | 3 types, scheduling, targeting |
| `/admin/orders` | Order Management | Processing workflow, status updates |
| `/admin/settings` | Settings | Store config, notifications, appearance |

## Quick Access

**Dashboard:** `/admin`
- Overview statistics
- Navigation to all sections
- Recent orders display

**Products:** `/admin/products`
- Add/Edit/Delete products
- Search & filter
- Stock management
- Best seller/top rated controls

**Categories:** `/admin/categories`
- Add/Edit/Delete categories
- Product count tracking
- Category activation

**Promotions:** `/admin/promotions`
- Banner management
- Discount campaigns
- Flash sales
- Date scheduling

**Orders:** `/admin/orders`
- View all orders
- Update order status
- Payment tracking
- Customer details

**Settings:** `/admin/settings`
- Store information
- Currency & tax
- Notifications
- Payment methods
- Shipping options

## Access Requirements
- ✅ Admin authentication required
- ✅ Valid session token
- ✅ Role-based access control

All endpoints are fully functional with UGX currency support.
