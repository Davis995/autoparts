'use client';

import { useState } from 'react';
import {
  Card,
  Text,
  Title,
  Group,
  Button,
  Stack,
  TextInput,
  Textarea,
  Grid,
} from '@mantine/core';
import {
  IconSettings,
  IconBuildingStore,
  IconUsers,
} from '@tabler/icons-react';

export default function AdminSettings() {
  const [opened, setOpened] = useState(false);
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  
  const toggle = () => setOpened((o) => !o);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage(null);
    setAdminError(null);

    if (!adminEmail || !adminPassword) {
      setAdminError('Email and password are required');
      return;
    }

    setAdminSubmitting(true);
    try {
      const response = await fetch('/api/admin/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          firstName: adminFirstName || null,
          lastName: adminLastName || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      setAdminMessage('Admin user created successfully');
      setAdminFirstName('');
      setAdminLastName('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (error: any) {
      setAdminError(error?.message || 'Failed to create admin user');
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={3}>Settings</Title>
              <Text c="dimmed">Configure your store settings and preferences</Text>
            </div>
            <Button>
              Save Changes
            </Button>
          </Group>

          {/* Store Information */}
          <Card withBorder p="lg">
            <Group mb="md">
              <IconBuildingStore size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
              <Title order={4}>Store Information</Title>
            </Group>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Store Name"
                  placeholder="AutoHub Garage"
                  defaultValue="AutoHub Garage"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Store Email"
                  placeholder="info@autohub.com"
                  defaultValue="info@autohub.com"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Phone Number"
                  placeholder="+256 123 456 789"
                  defaultValue="+256 123 456 789"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Address"
                  placeholder="123 Main St, Kampala, Uganda"
                  defaultValue="123 Main St, Kampala, Uganda"
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Description"
                  placeholder="Tell customers about your store"
                  rows={3}
                  defaultValue="Premium car accessories and parts for all vehicles"
                />
              </Grid.Col>
            </Grid>
          </Card>
          {/* Admin Users */}
          <Card withBorder p="lg">
            <Group mb="md">
              <IconUsers size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
              <Title order={4}>Admin Users</Title>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              Create additional admin accounts that can access and manage this dashboard.
            </Text>

            {adminError && (
              <Text size="sm" c="red" mb="xs">
                {adminError}
              </Text>
            )}
            {adminMessage && (
              <Text size="sm" c="green" mb="xs">
                {adminMessage}
              </Text>
            )}

            <form onSubmit={handleCreateAdmin}>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="First Name"
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    disabled={adminSubmitting}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Last Name"
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    disabled={adminSubmitting}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Email"
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={adminSubmitting}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Password"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    disabled={adminSubmitting}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Group justify="flex-end" mt="md">
                    <Button type="submit" loading={adminSubmitting}>
                      Create Admin User
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </form>
          </Card>
        </Stack>
  );
}
