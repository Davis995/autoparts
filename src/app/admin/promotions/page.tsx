'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Select,
  Modal,
  Textarea,
  Switch,
  Box,
  SimpleGrid,
  NumberInput,
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
  IconFilter,
  IconSpeakerphone,
  IconTag,
  IconCalendar,
  IconEye,
  IconEyeOff,
  IconPhoto,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { formatPrice } from '@/lib/currency';
import { usePromotions, useCreatePromotion, useUpdatePromotion, useDeletePromotion } from '@/hooks/usePromotions';
import { Database } from '@/types/database';

type Promotion = Database['public']['Tables']['promotions']['Row'];

export default function AdminPromotions() {
  const { data: promotions = [], isLoading, error } = usePromotions();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  
  const [opened, setOpened] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    bannerText: '',
    discount: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toggle = () => setOpened((o) => !o);

  useEffect(() => {
    if (!modalOpened) {
      setEditingPromotion(null);
      setFormData({ title: '', description: '', image: '', bannerText: '', discount: '', isActive: true });
    }
  }, [modalOpened]);

  useEffect(() => {
    if (editingPromotion && modalOpened) {
      setFormData({
        title: editingPromotion.title,
        description: editingPromotion.description || '',
        image: editingPromotion.image || '',
        bannerText: editingPromotion.bannerText || '',
        discount: editingPromotion.discount?.toString() || '',
        isActive: editingPromotion.isActive,
      });
    }
  }, [editingPromotion, modalOpened]);

  const getTypeColor = (promo: Promotion) => {
    if (promo.image) return 'blue';
    if (promo.discount) return 'green';
    return 'gray';
  };

  const getTypeIcon = (promo: Promotion) => {
    if (promo.image) return <IconPhoto size={14} />;
    if (promo.discount) return <IconTag size={14} />;
    return <IconSpeakerphone size={14} />;
  };

  const filteredPromotions = useMemo(() => {
    return promotions.filter(promo => {
      const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (promo.description && promo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [promotions, searchTerm]);

  const totalPromotions = filteredPromotions.length;
  const totalPages = totalPromotions === 0 ? 1 : Math.ceil(totalPromotions / pageSize);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Ensure current page is within bounds when promotion count changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedPromotions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPromotions.slice(start, start + pageSize);
  }, [filteredPromotions, page, pageSize]);

  const handleSubmit = async () => {
    if (!formData.title) {
      notifications.show({
        title: 'Validation Error',
        message: 'Promotion title is required',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const promotionData = {
        title: formData.title,
        description: formData.description || null,
        image: formData.image || null,
        bannerText: formData.bannerText || null,
        discount: formData.discount ? Number(formData.discount) : null,
        isActive: formData.isActive,
      };

      if (editingPromotion) {
        await updatePromotion.mutateAsync({
          id: editingPromotion.id,
          ...promotionData,
        });
        notifications.show({
          title: 'Success',
          message: 'Promotion updated successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else {
        await createPromotion.mutateAsync(promotionData);
        notifications.show({
          title: 'Success',
          message: 'Promotion created successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }

      setModalOpened(false);
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      
      // Extract error message from various error types
      let errorMessage = 'Failed to save promotion';
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
      if (errorMessage === 'Failed to save promotion') {
        console.error('createPromotion.error:', createPromotion.error);
        console.error('updatePromotion.error:', updatePromotion.error);
        
        if (createPromotion.error?.message) {
          errorMessage = createPromotion.error.message;
        } else if (updatePromotion.error?.message) {
          errorMessage = updatePromotion.error.message;
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

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Are you sure you want to delete "${promotion.title}"?`)) {
      return;
    }

    try {
      await deletePromotion.mutateAsync(promotion.id);
      notifications.show({
        title: 'Success',
        message: 'Promotion deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      
      // Extract error message from various error types
      let errorMessage = 'Failed to delete promotion';
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
      if (errorMessage === 'Failed to delete promotion') {
        console.error('deletePromotion.error:', deletePromotion.error);
        if (deletePromotion.error?.message) {
          errorMessage = deletePromotion.error.message;
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

  return (
    <Stack gap="lg">
          {/* Error Messages */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error Loading Promotions"
              color="red"
            >
              {error instanceof Error ? error.message : 'Failed to load promotions. Please check your Supabase connection.'}
            </Alert>
          )}

          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={3}>Promotions & Banners</Title>
              <Text c="dimmed">Manage promotional campaigns and banners</Text>
            </div>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingPromotion(null);
                setModalOpened(true);
              }}
            >
              Add Promotion
            </Button>
          </Group>

          {/* Filters */}
          <Card withBorder p="md">
            <Group align="flex-end">
              <TextInput
                placeholder="Search promotions..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
            </Group>
          </Card>

          {/* Promotions Grid */}
          {isLoading ? (
            <Card withBorder p="xl">
              <Group justify="center">
                <Loader size="sm" />
                <Text>Loading promotions...</Text>
              </Group>
            </Card>
          ) : filteredPromotions.length === 0 ? (
            <Card withBorder p="xl">
              <Group justify="center">
                <Text c="dimmed">No promotions found</Text>
              </Group>
            </Card>
          ) : (
            <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {paginatedPromotions.map((promo) => (
                <Card withBorder key={promo.id} shadow="sm">
                  <Card.Section h={120} bg="gradient-to-br from-blue-5 to-purple-6">
                    <Box h="100%" pos="relative">
                      {promo.image ? (
                        <Box
                          h="100%"
                          style={{
                            backgroundImage: `url(${promo.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      ) : (
                        <Box pos="absolute" inset={0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getTypeIcon(promo)}
                        </Box>
                      )}
                      <Badge
                        pos="absolute"
                        top="md"
                        right="md"
                        color={promo.isActive ? 'green' : 'gray'}
                        variant="light"
                      >
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Box>
                  </Card.Section>
                  
                  <Card.Section p="md">
                    <Group justify="space-between" mb="xs">
                      <Badge
                        color={getTypeColor(promo)}
                        variant="light"
                        leftSection={getTypeIcon(promo)}
                        size="sm"
                      >
                        {promo.image ? 'Banner' : promo.discount ? 'Discount' : 'Promotion'}
                      </Badge>
                      <Group gap={4}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => {
                            setEditingPromotion(promo);
                            setModalOpened(true);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(promo)}
                          loading={deletePromotion.isPending}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    
                    <Title order={5} mb="xs">{promo.title}</Title>
                    <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                      {promo.description || 'No description'}
                    </Text>
                    
                    {promo.discount && (
                      <Text size="lg" fw={700} c="blue" mb="md">
                        {formatPrice(Number(promo.discount))} OFF
                      </Text>
                    )}
                    
                    {promo.bannerText && (
                      <Text size="sm" fw={500} mb="md">
                        {promo.bannerText}
                      </Text>
                    )}
                    
                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        <IconCalendar size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                        <Text size="xs" c="dimmed">
                          {new Date(promo.createdAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Group>
                  </Card.Section>
                </Card>
              ))}
            </SimpleGrid>

            {!isLoading && filteredPromotions.length > 0 && (
              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  {(() => {
                    const start = (page - 1) * pageSize + 1;
                    const end = Math.min(page * pageSize, totalPromotions);
                    return `Showing ${start} - ${end} of ${totalPromotions} promotions`;
                  })()}
                </Text>
                <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
              </Group>
            )}
            </>
          )}

          {/* Add/Edit Promotion Modal */}
          <Modal
            opened={modalOpened}
            onClose={() => !isSubmitting && setModalOpened(false)}
            title={editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}
            size="lg"
          >
            <Stack gap="md">
              <TextInput
                label="Promotion Title"
                placeholder="e.g., Summer Sale, New Year Banner"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isSubmitting}
              />
              
              <Textarea
                label="Description"
                placeholder="Describe your promotion"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
              
              <TextInput
                label="Image URL (optional)"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                disabled={isSubmitting}
              />
              
              <TextInput
                label="Banner Text (optional)"
                placeholder="Special offer text"
                value={formData.bannerText}
                onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
                disabled={isSubmitting}
              />
              
              <NumberInput
                label="Discount Amount (optional)"
                placeholder="0"
                value={formData.discount}
                onChange={(value) => setFormData({ ...formData, discount: value?.toString() || '' })}
                disabled={isSubmitting}
              />
              
              <Switch
                label="Active"
                description="Promotion is currently active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.currentTarget.checked })}
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
                  {editingPromotion ? 'Update Promotion' : 'Add Promotion'}
                </Button>
              </Group>
            </Stack>
          </Modal>
        </Stack>
  );
}
