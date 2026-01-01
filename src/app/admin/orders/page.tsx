'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  Box,
  Grid,
  Modal,
  Divider,
  List,
  Textarea,
  Loader,
  Alert,
  Pagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconFilter,
  IconEye,
  IconPackage,
  IconTruck,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconRefresh,
  IconEdit,
  IconX,
  IconCheck,
} from '@tabler/icons-react';
import { formatPrice } from '@/lib/currency';
import { useOrders, useUpdateOrder, OrderWithDetails } from '@/hooks/useOrders';

export default function AdminOrders() {
  const { data: orders = [], isLoading, error } = useOrders({ scope: 'all', refetchIntervalMs: 1000 });
  const updateOrder = useUpdateOrder();
  
  const [opened, setOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const hasInitializedRef = useRef(false);
  const previousOrderCountRef = useRef(0);
  
  const toggle = () => setOpened((o) => !o);

  useEffect(() => {
    if (selectedOrder && editModalOpened) {
      setFormData({
        status: selectedOrder.status,
        address: selectedOrder.address,
      });
    }
  }, [selectedOrder, editModalOpened]);

  // Notify admin when new COD orders arrive
  useEffect(() => {
    if (!orders) return;

    // Track only CASH_ON_DELIVERY orders for the "new orders" notification
    const codOrders = orders.filter((o) => o.status === 'CASH_ON_DELIVERY');

    if (!hasInitializedRef.current) {
      previousOrderCountRef.current = codOrders.length;
      hasInitializedRef.current = true;
      return;
    }

    if (codOrders.length > previousOrderCountRef.current) {
      const newlyArrived = codOrders.length - previousOrderCountRef.current;
      previousOrderCountRef.current = codOrders.length;

      notifications.show({
        title: 'New order received',
        message:
          newlyArrived === 1
            ? '1 new order has just been placed.'
            : `${newlyArrived} new orders have just been placed.`,
        color: 'green',
        icon: <IconPackage size={16} />,
      });

      // Also show inline alert at top of page, counting only COD orders
      setNewOrdersCount((count) => count + newlyArrived);
    } else if (codOrders.length < previousOrderCountRef.current) {
      // Keep count in sync if COD orders are removed/updated
      previousOrderCountRef.current = codOrders.length;
    }
  }, [orders]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
  ];

  const getCustomerName = (order: OrderWithDetails) => {
    const user = order.user;
    if (!user) return '';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'CASH_ON_DELIVERY': return 'orange';
      case 'PAID': return 'green';
      case 'OUT_FOR_DELIVERY': return 'blue';
      case 'DELIVERED': return 'green';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <IconClock size={14} />;
      case 'CASH_ON_DELIVERY': return <IconTruck size={14} />;
      case 'PAID': return <IconCircleCheck size={14} />;
      case 'OUT_FOR_DELIVERY': return <IconTruck size={14} />;
      case 'DELIVERED': return <IconCircleCheck size={14} />;
      default: return null;
    }
  };

  const getPaymentLabel = (order: OrderWithDetails) => {
    if (order.paymentMethod === 'COD' || !order.paymentMethod) {
      return 'Cash on Delivery';
    }
    return order.paymentMethod;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const customerName = getCustomerName(order);
      const customerEmail = order.user?.email || '';
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page]);

  const orderStats = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === 'PENDING').length,
      cod: orders.filter(o => o.status === 'CASH_ON_DELIVERY').length,
      outForDelivery: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
    };
  }, [orders]);

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    setIsSubmitting(true);
    try {
      await updateOrder.mutateAsync({
        id: selectedOrder.id,
        status: formData.status,
        address: formData.address,
      });
      notifications.show({
        title: 'Success',
        message: 'Order updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setEditModalOpened(false);
    } catch (error: any) {
      console.error('Error updating order:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      
      // Extract error message from various error types
      let errorMessage = 'Failed to update order';
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
      if (errorMessage === 'Failed to update order') {
        console.error('updateOrder.error:', updateOrder.error);
        if (updateOrder.error?.message) {
          errorMessage = updateOrder.error.message;
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

  return (
    <Stack gap="lg">
          {/* Error Messages */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error Loading Orders"
              color="red"
            >
              {error instanceof Error ? error.message : 'Failed to load orders. Please check your Supabase connection.'}
            </Alert>
          )}

          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={3}>Orders Management</Title>
              <Text c="dimmed">Process and track customer orders</Text>
            </div>
          </Group>

          {/* New Orders Alert */}
          {newOrdersCount > 0 && (
            <Alert
              icon={<IconPackage size={16} />}
              title="New order received"
              color="green"
              withCloseButton
              onClose={() => setNewOrdersCount(0)}
            >
              {newOrdersCount === 1
                ? '1 new order has just been placed.'
                : `${newOrdersCount} new orders have just been placed.`}
            </Alert>
          )}

          {/* Filters */}
          <Card withBorder p="md">
            <Group align="flex-end">
              <TextInput
                placeholder="Search orders..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Filter by status"
                data={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                leftSection={<IconFilter size={16} />}
                w={200}
              />
            </Group>
          </Card>

          {/* Orders Table */}
          <Card withBorder p="lg">
            <Group justify="space-between" mb="md">
              <Text size="sm" c="dimmed">
                Showing {filteredOrders.length === 0 ? 0 : (page - 1) * pageSize + 1}
                {' - '}
                {Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
              </Text>
              {totalPages > 1 && (
                <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
              )}
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Order ID</Table.Th>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Items</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Payment</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Group justify="center" p="xl">
                        <Loader size="sm" />
                        <Text>Loading orders...</Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredOrders.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Group justify="center" p="xl">
                        <Text c="dimmed">No orders found</Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedOrders.map((order) => (
                  <Table.Tr key={order.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">{order.id}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Box>
                        <Text fw={500} size="sm">{getCustomerName(order) || 'N/A'}</Text>
                        <Text size="xs" c="dimmed">{order.user?.email || 'N/A'}</Text>
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{order.orderItems?.length || 0} items</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{formatPrice(Number(order.total))}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="gray" variant="light" size="sm">
                        {getPaymentLabel(order)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(order.status)}
                        variant="light"
                        leftSection={getStatusIcon(order.status)}
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(order.createdAt).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon 
                          size="sm" 
                          variant="subtle"
                          onClick={() => {
                            setSelectedOrder(order);
                            setViewModalOpened(true);
                          }}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                        <ActionIcon 
                          size="sm" 
                          variant="subtle"
                          onClick={() => {
                            setSelectedOrder(order);
                            setEditModalOpened(true);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>

          {/* Order Stats */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder p="lg">
                <Group justify="space-between" mb="xs">
                  <IconClock size={24} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                  <Badge color="yellow" variant="light">{orderStats.pending}</Badge>
                </Group>
                <Text size="xs" c="dimmed">Pending Orders</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder p="lg">
                <Group justify="space-between" mb="xs">
                  <IconTruck size={24} style={{ color: 'var(--mantine-color-orange-6)' }} />
                  <Badge color="orange" variant="light">{orderStats.cod}</Badge>
                </Group>
                <Text size="xs" c="dimmed">Cash on Delivery</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder p="lg">
                <Group justify="space-between" mb="xs">
                  <IconTruck size={24} style={{ color: 'var(--mantine-color-indigo-6)' }} />
                  <Badge color="indigo" variant="light">{orderStats.outForDelivery}</Badge>
                </Group>
                <Text size="xs" c="dimmed">Out for Delivery</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder p="lg">
                <Group justify="space-between" mb="xs">
                  <IconCircleCheck size={24} style={{ color: 'var(--mantine-color-green-6)' }} />
                  <Badge color="green" variant="light">{orderStats.delivered}</Badge>
                </Group>
                <Text size="xs" c="dimmed">Delivered</Text>
              </Card>
            </Grid.Col>
          </Grid>

          {/* View Order Modal */}
          <Modal
            opened={viewModalOpened}
            onClose={() => setViewModalOpened(false)}
            title={`Order Details - ${selectedOrder?.id}`}
            size="lg"
          >
            {selectedOrder && (
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Customer Name</Text>
                    <Text fw={500}>{getCustomerName(selectedOrder) || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Order ID</Text>
                    <Text fw={500}>{selectedOrder.id}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Email</Text>
                    <Text>{selectedOrder.user?.email || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Phone</Text>
                    <Text>{selectedOrder.phone || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">Delivery Location</Text>
                    <Text>{selectedOrder.locationName || selectedOrder.address || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Distance (km)</Text>
                    <Text>{selectedOrder.distanceKm != null ? selectedOrder.distanceKm.toFixed(2) : 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Payment Method</Text>
                    <Text>{getPaymentLabel(selectedOrder)}</Text>
                  </Grid.Col>
                </Grid>

                <Divider />

                <Box>
                  <Text size="sm" c="dimmed" mb="xs">Order Items</Text>
                  <List spacing="xs">
                    {selectedOrder.orderItems?.map((item) => (
                      <List.Item key={item.id}>
                        <Group justify="space-between">
                          <Text>{item.product?.name || 'Unknown Product'} x {item.quantity}</Text>
                          <Text fw={500}>{formatPrice(Number(item.price) * item.quantity)}</Text>
                        </Group>
                      </List.Item>
                    ))}
                  </List>
                </Box>

                <Divider />

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Products Total</Text>
                  <Text fw={500}>{formatPrice(Number(selectedOrder.totalAmount ?? selectedOrder.total))}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Transport Fee</Text>
                  <Text fw={500}>{formatPrice(Number(selectedOrder.transportFee ?? 0))}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Service Fee</Text>
                  <Text fw={500}>{formatPrice(Number(selectedOrder.serviceFee ?? 0))}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="lg" fw={700}>Total Amount</Text>
                  <Text size="lg" fw={700} c="blue">{formatPrice(Number(selectedOrder.totalAmount ?? selectedOrder.total))}</Text>
                </Group>

                <Group justify="space-between">
                  <Badge
                    color={getStatusColor(selectedOrder.status)}
                    variant="light"
                    leftSection={getStatusIcon(selectedOrder.status)}
                  >
                    {selectedOrder.status}
                  </Badge>
                  <Badge color="gray" variant="light">
                    {getPaymentLabel(selectedOrder)}
                  </Badge>
                </Group>
              </Stack>
            )}
          </Modal>

          {/* Edit Order Modal */}
          <Modal
            opened={editModalOpened}
            onClose={() => setEditModalOpened(false)}
            title={`Edit Order - ${selectedOrder?.id}`}
            size="md"
          >
            {selectedOrder && (
              <Stack gap="md">
                <Select
                  label="Order Status"
                  data={[
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery' },
                    { value: 'PAID', label: 'Paid' },
                    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                    { value: 'DELIVERED', label: 'Delivered' },
                  ]}
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value || '' })}
                  disabled={isSubmitting}
                />

                <Textarea
                  label="Shipping Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />

                <Group justify="flex-end" mt="md">
                  <Button
                    variant="subtle"
                    onClick={() => setEditModalOpened(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateOrder}
                    loading={isSubmitting}
                  >
                    Update Order
                  </Button>
                </Group>
              </Stack>
            )}
          </Modal>
        </Stack>
  );
}
