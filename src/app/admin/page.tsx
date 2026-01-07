'use client';

import { useMemo } from 'react';
import {
  Grid,
  Card,
  Text,
  Title,
  Group,
  Badge,
  Button,
  SimpleGrid,
  Table,
  Progress,
  Stack,
  Box,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconPackage,
  IconShoppingCart,
  IconUsers,
  IconTrendingUp,
  IconSettings,
  IconPlus,
  IconEye,
  IconDots,
  IconAlertCircle,
} from '@tabler/icons-react';
import { formatPrice } from '@/lib/currency';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export default function AdminDashboard() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: orders = [], isLoading: ordersLoading } = useOrders({
    // Keep dashboard order stats live using Supabase realtime
    // @ts-expect-error - internal flag on useOrders
    enableRealtime: true,
  });
  
  const { data: customersCount = 0, isLoading: customersLoading } = useQuery({
    queryKey: ['customers-count'],
    queryFn: async () => {
      const response = await fetch('/api/customers/count');
      if (!response.ok) {
        throw new Error('Failed to fetch customers count');
      }
      const data = await response.json();
      return data.count || 0;
    },
  });

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      totalCustomers: customersCount,
    };
  }, [products, orders, customersCount]);

  const recentOrders = useMemo(() => {
    return orders
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        customer: order.user ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim() || order.user.email : 'Unknown',
        amount: Number(order.total),
        status: order.status.toLowerCase(),
      }));
  }, [orders]);

  const topProducts = useMemo(() => {
    // Get product sales from order items
    const productSales: Record<string, { name: string; sold: number; price: number }> = {};
    
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        const productId = item.productId;
        const product = item.product;
        if (product) {
          if (!productSales[productId]) {
            productSales[productId] = {
              name: product.name,
              sold: 0,
              price: Number(product.price),
            };
          }
          productSales[productId].sold += item.quantity;
        }
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'processing': return 'blue';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Stack gap="lg">
          {/* Stats Cards */}
          {productsLoading || ordersLoading || customersLoading ? (
            <Card withBorder p="xl">
              <Group justify="center">
                <Loader size="sm" />
                <Text>Loading dashboard data...</Text>
              </Group>
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              <Card withBorder p="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <IconPackage size={24} color="blue" />
                </Group>
                <Text size="xs" c="dimmed" mb="xs">Total Products</Text>
                <Text size="xl" fw={700}>{stats.totalProducts}</Text>
              </Card>

              <Card withBorder p="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <IconShoppingCart size={24} color="green" />
                </Group>
                <Text size="xs" c="dimmed" mb="xs">Total Orders</Text>
                <Text size="xl" fw={700}>{stats.totalOrders}</Text>
              </Card>

              <Card withBorder p="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <IconTrendingUp size={24} color="purple" />
                </Group>
                <Text size="xs" c="dimmed" mb="xs">Total Revenue</Text>
                <Text size="xl" fw={700}>{formatPrice(stats.totalRevenue)}</Text>
              </Card>

              <Card withBorder p="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <IconUsers size={24} color="orange" />
                </Group>
                <Text size="xs" c="dimmed" mb="xs">Total Customers</Text>
                <Text size="xl" fw={700}>{stats.totalCustomers}</Text>
              </Card>
            </SimpleGrid>
          )}

          {/* Recent Orders and Top Products */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="lg" radius="md" h="100%">
                <Group justify="space-between" mb="md">
                  <Title order={4}>Recent Orders</Title>
                  <Button variant="subtle" size="sm" rightSection={<IconEye size={14} />}>
                    View All
                  </Button>
                </Group>
                
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Order</Table.Th>
                      <Table.Th>Customer</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {recentOrders.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text c="dimmed" ta="center" p="md">No recent orders</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      recentOrders.map((order) => (
                        <Table.Tr key={order.id}>
                          <Table.Td>
                            <Text fw={500}>{order.id}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{order.customer}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500}>{formatPrice(order.amount)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={getStatusColor(order.status)} variant="light">
                              {order.status}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="lg" style={{ borderRadius: '8px' }} h="100%">
                <Group justify="space-between" mb="md">
                  <Title order={4}>Top Products</Title>
                  <Button variant="subtle" size="sm" rightSection={<IconEye size={14} />}>
                    View All
                  </Button>
                </Group>
                
                <Stack gap="sm">
                  {topProducts.length === 0 ? (
                    <Text c="dimmed" ta="center" p="md">No product sales data</Text>
                  ) : (
                    topProducts.map((product, index) => (
                      <Group key={index} justify="space-between" p="sm" bg="gray.0" style={{ borderRadius: '4px' }}>
                        <Box>
                          <Text fw={500} size="sm">{product.name}</Text>
                          <Text size="xs" c="dimmed">{product.sold} sold</Text>
                        </Box>
                        <Box ta="right">
                          <Text fw={500}>{formatPrice(product.price)}</Text>
                        </Box>
                      </Group>
                    ))
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
  );
}
