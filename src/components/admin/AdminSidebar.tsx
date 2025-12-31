'use client';

import { useState } from 'react';
import {
  AppShell,
  Text,
  NavLink,
  Group,
  Button,
  Avatar,
  UnstyledButton,
  Tooltip,
  rem,
} from '@mantine/core';
import {
  IconDashboard,
  IconPackage,
  IconShoppingCart,
  IconUsers,
  IconTrendingUp,
  IconSettings,
  IconLogout,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';

interface AdminSidebarProps {
  opened: boolean;
  onClose: () => void;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function AdminSidebar({ opened, onClose, user }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { icon: IconDashboard, label: 'Dashboard', href: '/admin' },
    { icon: IconPackage, label: 'Products', href: '/admin/products' },
    { icon: IconShoppingCart, label: 'Orders', href: '/admin/orders' },
    { icon: IconUsers, label: 'Categories', href: '/admin/categories' },
    { icon: IconTrendingUp, label: 'Promotions', href: '/admin/promotions' },
    { icon: IconSettings, label: 'Settings', href: '/admin/settings' },
  ];

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session');
      }
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'Admin User';
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'A';
  };

  return (
    <AppShell.Navbar p="xs" w={{ base: 240, md: 260 }}>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Text fw={700} size="lg" c="blue">
          AutoHub Admin
        </Text>
        <Button
          variant="subtle"
          size="sm"
          onClick={onClose}
          display={{ base: 'block', md: 'none' }}
        >
          <IconX size={16} />
        </Button>
      </Group>

      {/* User Info */}
      <UnstyledButton
        w="100%"
        p="xs"
        mb="md"
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
        }}
      >
        <Group>
          <Avatar radius="xl" size="sm" color="blue">
            {getInitials()}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500}>
              {getDisplayName()}
            </Text>
            <Text size="xs" c="dimmed">
              {user?.email || 'Admin'}
            </Text>
          </div>
        </Group>
      </UnstyledButton>

      {/* Navigation */}
      <div style={{ flex: 1 }}>
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            leftSection={<item.icon size={16} />}
            active={pathname === item.href}
            onClick={() => { router.push(item.href); onClose(); }}
            mb={4}
            p="xs"
          />
        ))}
      </div>

      {/* Logout */}
      <NavLink
        label="Logout"
        leftSection={<IconLogout size={16} />}
        onClick={handleLogout}
        c="red"
      />
    </AppShell.Navbar>
  );
}
