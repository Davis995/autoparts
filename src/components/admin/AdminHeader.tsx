'use client';

import { useState } from 'react';
import { Button, Group, Title, Text, Badge, Menu, Avatar, UnstyledButton, Burger } from '@mantine/core';
import { IconMenu2, IconBell, IconSearch, IconChevronDown, IconLogout, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';

interface AdminHeaderProps {
  toggle: () => void;
  opened: boolean;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function AdminHeader({ toggle, opened, user }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabaseClient.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session');
      }
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
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
    <Group h="100%" px="sm" justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <Burger opened={opened} onClick={toggle} aria-label="Toggle navigation" />
        <Title order={3} c="blue">
          Admin Dashboard
        </Title>
      </Group>

      <Group gap="xs">
        <Button variant="subtle" size="xs">
          <IconSearch size={16} />
        </Button>
        <Button variant="subtle" size="xs" pos="relative">
          <IconBell size={16} />
          <Badge
            size="xs"
            pos="absolute"
            top={5}
            right={5}
            color="red"
            style={{ padding: 0, minWidth: 16, height: 16, borderRadius: '50%' }}
          >
            3
          </Badge>
        </Button>

        <Menu shadow="md" width={220}>
          <Menu.Target>
            <UnstyledButton>
              <Group gap={8}>
                <Avatar size="sm" radius="xl" color="blue">
                  {getInitials()}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500} c="gray.7">
                    {getDisplayName()}
                  </Text>
                  <Text size="xs" c="gray.5">
                    Administrator
                  </Text>
                </div>
                <IconChevronDown size={16} style={{ color: '#868e96' }} />
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item leftSection={<IconUser size={16} />}>
              Profile Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}
