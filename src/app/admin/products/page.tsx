'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Grid,
  Card,
  Text,
  Title,
  Group,
  Badge,
  Button,
  Table,
  Stack,
  ActionIcon,
  TextInput,
  Select,
  Switch,
  Modal,
  NumberInput,
  Textarea,
  Box,
  FileInput,
  Image,
  Loader,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconStar,
  IconTrendingUp,
  IconPackage,
  IconFilter,
  IconUpload,
  IconX,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { formatPrice } from '@/lib/currency';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { uploadImages, deleteImages } from '@/lib/storage';

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  categoryId: string;
  images: string[];
  isActive: boolean;
  isBestSelling: boolean;
  isTopSelling: boolean;
  createdAt: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number | string;
  stock: number | string;
  categoryId: string;
  isActive: boolean;
  isBestSelling: boolean;
  isTopSelling: boolean;
}

export default function AdminProducts() {
  const { data: rawProducts = [], isLoading: productsLoading, error: productsError } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const [opened, setOpened] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    isActive: true,
    isBestSelling: false,
    isTopSelling: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = () => setOpened((o) => !o);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!modalOpened) {
      setEditingProduct(null);
      setProductImages([]);
      setExistingImages([]);
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        categoryId: '',
        isActive: true,
        isBestSelling: false,
        isTopSelling: false,
      });
    }
  }, [modalOpened]);

  // Populate form when editing
  useEffect(() => {
    if (editingProduct && modalOpened) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        stock: editingProduct.stock,
        categoryId: editingProduct.categoryId,
        isActive: editingProduct.isActive,
        isBestSelling: editingProduct.isBestSelling,
        isTopSelling: editingProduct.isTopSelling,
      });
      setExistingImages(editingProduct.images || []);
    }
  }, [editingProduct, modalOpened]);

  const products: AdminProduct[] = useMemo(
    () =>
      (rawProducts as any[]).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        stock: p.stock,
        category: p.category?.name ?? 'Uncategorized',
        categoryId: p.categoryId,
        images: p.images ?? [],
        isActive: p.isActive,
        isBestSelling: p.isBestSelling,
        isTopSelling: p.isTopSelling,
        createdAt: p.createdAt,
      })),
    [rawProducts]
  );

  const categoryOptions = useMemo(() => {
    const options = categories.map((cat) => ({ value: cat.id, label: cat.name }));
    return [{ value: 'all', label: 'All Categories' }, ...options];
  }, [categories]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: boolean) => status ? 'green' : 'red';
  const getStatusText = (status: boolean) => status ? 'Active' : 'Inactive';

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.price || !formData.categoryId) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fill in all required fields',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrls = [...existingImages];

      // Upload new images if any
      if (productImages.length > 0) {
        const uploadedUrls = await uploadImages(productImages);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock) || 0,
        categoryId: formData.categoryId,
        images: imageUrls,
        isActive: formData.isActive,
        isBestSelling: formData.isBestSelling,
        isTopSelling: formData.isTopSelling,
      };

      if (editingProduct) {
        // Update existing product
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...productPayload,
        });
        notifications.show({
          title: 'Success',
          message: 'Product updated successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else {
        // Create new product
        await createProduct.mutateAsync(productPayload);
        notifications.show({
          title: 'Success',
          message: 'Product created successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }

      setModalOpened(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      
      // Handle React Query wrapped errors
      let actualError = error;
      if (error?.cause) {
        console.error('Found error.cause:', error.cause);
        actualError = error.cause;
      }
      
      // Extract error message from various error types
      let errorMessage = 'Failed to save product';
      if (actualError?.message) {
        errorMessage = actualError.message;
      } else if (typeof actualError === 'string') {
        errorMessage = actualError;
      } else if (actualError?.error?.message) {
        errorMessage = actualError.error.message;
      } else if (actualError?.data?.message) {
        errorMessage = actualError.data.message;
      } else if (actualError?.details) {
        errorMessage = actualError.details;
      } else if (actualError?.hint) {
        errorMessage = actualError.hint;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check mutation error states
      if (errorMessage === 'Failed to save product') {
        console.error('createProduct.error:', createProduct.error);
        console.error('updateProduct.error:', updateProduct.error);
        
        if (createProduct.error?.message) {
          errorMessage = createProduct.error.message;
        } else if (updateProduct.error?.message) {
          errorMessage = updateProduct.error.message;
        }
      }
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: AdminProduct) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      // Delete images from storage
      if (product.images && product.images.length > 0) {
        await deleteImages(product.images);
      }

      await deleteProduct.mutateAsync(product.id);
      notifications.show({
        title: 'Success',
        message: 'Product deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      
      // Extract error message from various error types
      let errorMessage = 'Failed to delete product';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }
      
      // Check mutation error states
      if (errorMessage === 'Failed to delete product') {
        console.error('deleteProduct.error:', deleteProduct.error);
        if (deleteProduct.error?.message) {
          errorMessage = deleteProduct.error.message;
        }
      }
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  return (
    <Stack gap="lg">
          {/* Error Messages */}
          {productsError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error Loading Products"
              color="red"
              onClose={() => {}}
            >
              {productsError instanceof Error ? productsError.message : 'Failed to load products. Please check your Supabase connection and RLS policies.'}
            </Alert>
          )}
          {categoriesError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error Loading Categories"
              color="red"
              onClose={() => {}}
            >
              {categoriesError instanceof Error ? categoriesError.message : 'Failed to load categories. Please check your Supabase connection and RLS policies.'}
            </Alert>
          )}

          {/* Header */}
          <Group justify="space-between">
            <Title order={3}>Products Management</Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingProduct(null);
                setModalOpened(true);
              }}
            >
              Add Product
            </Button>
          </Group>

          {/* Filters */}
          <Card withBorder p="md">
            <Group align="flex-end">
              <TextInput
                placeholder="Search products..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Select category"
                data={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                leftSection={<IconFilter size={16} />}
                w={200}
                disabled={categoriesLoading}
              />
            </Group>
          </Card>

          {/* Products Table */}
          <Card withBorder p="lg">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Stock</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Features</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {productsLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Group justify="center" p="xl">
                        <Loader size="sm" />
                        <Text>Loading products...</Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredProducts.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Group justify="center" p="xl">
                        <Text c="dimmed">No products found</Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredProducts.map((product) => (
                  <Table.Tr key={product.id}>
                    <Table.Td>
                      <Group>
                        <Box w={48} h={48} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={48}
                              height={48}
                              fit="cover"
                              radius="sm"
                            />
                          ) : (
                            <Box
                              w={40}
                              h={40}
                              bg="gray.1"
                              style={{
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconPackage size={20} color="gray" />
                            </Box>
                          )}
                        </Box>
                        <Box miw={160} maw={260}>
                          <Text fw={500} size="sm">{product.name}</Text>
                          <Text size="xs" c="dimmed" lineClamp={2}>{product.description}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{product.category}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{formatPrice(product.price)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group>
                        <Text>{product.stock}</Text>
                        {product.stock < 10 && <Badge color="red" size="xs">Low</Badge>}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(product.isActive)} variant="light">
                        {getStatusText(product.isActive)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {product.isBestSelling && <IconStar size={14} color="yellow" />}
                        {product.isTopSelling && <IconTrendingUp size={14} color="blue" />}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => {
                            setSelectedProduct(product);
                            setViewModalOpened(true);
                          }}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => {
                            setEditingProduct(product);
                            setModalOpened(true);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(product)}
                          loading={deleteProduct.isPending}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>

          {/* View Product Modal */}
        <Modal
          opened={viewModalOpened}
          onClose={() => setViewModalOpened(false)}
          title={selectedProduct ? selectedProduct.name : 'Product details'}
          size="lg"
        >
          {selectedProduct && (
            <Stack gap="md">
              <Group align="flex-start" wrap="nowrap">
                <Box w={180} h={180} mr="md" style={{ flexShrink: 0 }}>
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <Image
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      width={180}
                      height={180}
                      fit="cover"
                      radius="md"
                    />
                  ) : (
                    <Box
                      w={180}
                      h={180}
                      bg="gray.1"
                      style={{
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconPackage size={48} color="gray" />
                    </Box>
                  )}
                </Box>
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">
                    Category
                  </Text>
                  <Text fw={500}>{selectedProduct.category}</Text>
                  <Group mt="sm">
                    <Badge color={getStatusColor(selectedProduct.isActive)} variant="light">
                      {getStatusText(selectedProduct.isActive)}
                    </Badge>
                    {selectedProduct.isBestSelling && (
                      <Badge color="yellow" leftSection={<IconStar size={12} />}>
                        Best selling
                      </Badge>
                    )}
                    {selectedProduct.isTopSelling && (
                      <Badge color="blue" leftSection={<IconTrendingUp size={12} />}>
                        Top rated
                      </Badge>
                    )}
                  </Group>
                  <Group mt="sm">
                    <Text fw={700}>{formatPrice(selectedProduct.price)}</Text>
                    <Text size="sm" c="dimmed">
                      Stock: {selectedProduct.stock}
                    </Text>
                  </Group>
                </Stack>
              </Group>

              <Box>
                <Text size="sm" fw={500} mb="xs">
                  Description
                </Text>
                <Text size="sm" c="dimmed">
                  {selectedProduct.description}
                </Text>
              </Box>

              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    More images
                  </Text>
                  <Group gap="sm">
                    {selectedProduct.images.slice(1).map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`${selectedProduct.name} image ${index + 2}`}
                        width={80}
                        height={80}
                        fit="cover"
                        radius="md"
                      />
                    ))}
                  </Group>
                </Box>
              )}
            </Stack>
          )}
        </Modal>

          {/* Add/Edit Product Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => !isSubmitting && setModalOpened(false)}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          size="lg"
        >
          <Stack gap="md">
            <TextInput
              label="Product Name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
            <Textarea
              label="Description"
              placeholder="Enter product description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isSubmitting}
            />
            <Group>
              <NumberInput
                label="Price (UGX)"
                placeholder="0"
                decimalScale={0}
                thousandSeparator=","
                value={formData.price}
                onChange={(value) => setFormData({ ...formData, price: value || '' })}
                style={{ flex: 1 }}
                required
                disabled={isSubmitting}
              />
              <NumberInput
                label="Stock"
                placeholder="0"
                value={formData.stock}
                onChange={(value) => setFormData({ ...formData, stock: value || '' })}
                style={{ flex: 1 }}
                disabled={isSubmitting}
              />
            </Group>
            <Select
              label="Category"
              placeholder="Select category"
              data={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value || '' })}
              required
              disabled={isSubmitting || categoriesLoading}
              searchable
            />
            <FileInput
              label="Product Images"
              placeholder="Upload product images"
              accept="image/*"
              multiple
              value={productImages}
              onChange={setProductImages}
              leftSection={<IconUpload size={16} />}
              disabled={isSubmitting}
            />
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <Box>
                <Text size="sm" fw={500} mb="xs">Existing Images:</Text>
                <Group gap="md">
                  {existingImages.map((url, index) => (
                    <Box key={index} pos="relative">
                      <Image
                        src={url}
                        alt={`Product image ${index + 1}`}
                        width={80}
                        height={80}
                        fit="cover"
                        radius="md"
                      />
                      <ActionIcon
                        size="sm"
                        variant="filled"
                        color="red"
                        pos="absolute"
                        top={-5}
                        right={-5}
                        onClick={() => handleRemoveExistingImage(index)}
                        disabled={isSubmitting}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    </Box>
                  ))}
                </Group>
              </Box>
            )}
            
            {/* New Image Previews */}
            {productImages.length > 0 && (
              <Box>
                <Text size="sm" fw={500} mb="xs">New Image Previews:</Text>
                <Group gap="md">
                  {productImages.map((file, index) => (
                    <Box key={index} pos="relative">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Product image ${index + 1}`}
                        width={80}
                        height={80}
                        fit="cover"
                        radius="md"
                      />
                      <ActionIcon
                        size="sm"
                        variant="filled"
                        color="red"
                        pos="absolute"
                        top={-5}
                        right={-5}
                        onClick={() => {
                          const newImages = productImages.filter((_, i) => i !== index);
                          setProductImages(newImages);
                        }}
                        disabled={isSubmitting}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    </Box>
                  ))}
                </Group>
              </Box>
            )}
            
            <Group>
              <Switch
                label="Active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.currentTarget.checked })}
                disabled={isSubmitting}
              />
              <Switch
                label="Best Selling"
                checked={formData.isBestSelling}
                onChange={(e) => setFormData({ ...formData, isBestSelling: e.currentTarget.checked })}
                disabled={isSubmitting}
              />
              <Switch
                label="Top Rated"
                checked={formData.isTopSelling}
                onChange={(e) => setFormData({ ...formData, isTopSelling: e.currentTarget.checked })}
                disabled={isSubmitting}
              />
            </Group>
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => setModalOpened(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
  );
}
