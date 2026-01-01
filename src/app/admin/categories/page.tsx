'use client';

import { useState, useEffect } from 'react';
import {
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
  Modal,
  Textarea,
  Switch,
  Box,
  SimpleGrid,
  Loader,
  Alert,
  Pagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFolderOpen,
  IconPackage,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, CategoryWithProductCount } from '@/hooks/useCategories';

export default function AdminCategories() {
  const { data: categories = [], isLoading, error } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const [opened, setOpened] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithProductCount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!modalOpened) {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
  }, [modalOpened]);

  useEffect(() => {
    if (editingCategory && modalOpened) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || '',
      });
    }
  }, [editingCategory, modalOpened]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCategories = filteredCategories.length;
  const totalPages = totalCategories === 0 ? 1 : Math.ceil(totalCategories / pageSize);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Ensure current page is within bounds when category count changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedCategories = filteredCategories.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  
  const getStatusColor = (status: boolean) => status ? 'green' : 'gray';
  const getStatusText = (status: boolean) => status ? 'Active' : 'Inactive';

  const handleSubmit = async () => {
    if (!formData.name) {
      notifications.show({
        title: 'Validation Error',
        message: 'Category name is required',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryData = {
        name: formData.name,
        description: formData.description || null,
        // Matches CategoryInsert defaults
        slug: formData.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
        imageUrl: null as string | null,
        isActive: true,
        sortOrder: 0,
      };

      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...categoryData,
        });
        notifications.show({
          title: 'Success',
          message: 'Category updated successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else {
        await createCategory.mutateAsync(categoryData);
        notifications.show({
          title: 'Success',
          message: 'Category created successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }

      setModalOpened(false);
    } catch (error: any) {
      // Enhanced debugging for error object
      console.error('Error saving category - raw error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      console.error('Stringified error:', JSON.stringify(error, null, 2));
      
      // Handle React Query wrapped errors
      let actualError = error;
      if (error?.cause) {
        console.error('Found error.cause:', error.cause);
        actualError = error.cause;
      }
      
      // Extract error message from various error types
      let errorMessage = 'Failed to save category';
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
      
      // If we still don't have a good message, try to get more info
      if (errorMessage === 'Failed to save category') {
        console.error('Checking mutation states...');
        console.error('createCategory.error:', createCategory.error);
        console.error('updateCategory.error:', updateCategory.error);
        
        if (createCategory.error?.message) {
          errorMessage = createCategory.error.message;
        } else if (updateCategory.error?.message) {
          errorMessage = updateCategory.error.message;
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

  const handleDelete = async (category: CategoryWithProductCount) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      notifications.show({
        title: 'Success',
        message: 'Category deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      
      // Extract error message from various error types
      let errorMessage = 'Failed to delete category';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  return (
    <Stack gap="lg">
      {/* Error Messages */}
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error Loading Categories"
          color="red"
        >
          {error instanceof Error ? error.message : 'Failed to load categories. Please check your Supabase connection.'}
        </Alert>
      )}

      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={3}>Categories</Title>
          <Text c="dimmed">Manage product categories</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setEditingCategory(null);
            setModalOpened(true);
          }}
        >
          Add Category
        </Button>
      </Group>

      {/* Search */}
      <Card withBorder p="md">
        <TextInput
          placeholder="Search categories..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Categories Grid */}
      {isLoading ? (
        <Card withBorder p="xl">
          <Group justify="center">
            <Loader size="sm" />
            <Text>Loading categories...</Text>
          </Group>
        </Card>
      ) : filteredCategories.length === 0 ? (
        <Card withBorder p="xl">
          <Group justify="center">
            <Text c="dimmed">No categories found</Text>
          </Group>
        </Card>
      ) : (
        <>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {paginatedCategories.map((category) => (
            <Card withBorder key={category.id} shadow="sm">
              <Card.Section h={120} bg="gradient-to-br from-blue-5 to-purple-6">
                <Box h="100%" pos="relative">
                  <Box pos="absolute" inset={0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconFolderOpen size={48} style={{ color: 'white', opacity: 0.5 }} />
                  </Box>
                  <Badge
                    pos="absolute"
                    top="md"
                    right="md"
                    color={getStatusColor(category.isActive)}
                    variant="light"
                  >
                    {getStatusText(category.isActive)}
                  </Badge>
                </Box>
              </Card.Section>

              <Card.Section p="md">
                <Title order={5} mb="xs">{category.name}</Title>
                <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                  {category.description}
                </Text>

                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <IconPackage size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text size="xs" c="dimmed">{category.productCount} products</Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {category.createdAt
                      ? new Date(category.createdAt as any).toLocaleDateString()
                      : ''}
                  </Text>
                </Group>

                <Group gap="xs">
                  <Button
                    variant="light"
                    size="sm"
                    flex={1}
                    leftSection={<IconEdit size={12} />}
                    onClick={() => {
                      setEditingCategory(category);
                      setModalOpened(true);
                    }}
                  >
                    Edit
                  </Button>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    loading={deleteCategory.isPending}
                  >
                    <IconTrash size={12} />
                  </ActionIcon>
                </Group>
              </Card.Section>
            </Card>
          ))}
        </SimpleGrid>

        {!isLoading && filteredCategories.length > 0 && (
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              {(() => {
                const start = (page - 1) * pageSize + 1;
                const end = Math.min(page * pageSize, totalCategories);
                return `Showing ${start} - ${end} of ${totalCategories} categories`;
              })()}
            </Text>
            <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
          </Group>
        )}
        </>
      )}

      {/* Add/Edit Category Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => !isSubmitting && setModalOpened(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Category Name"
            placeholder="e.g., Interior, Lighting, Electronics"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSubmitting}
          />
          <Textarea
            label="Description"
            placeholder="Describe what products belong in this category"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
          />
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
              {editingCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
