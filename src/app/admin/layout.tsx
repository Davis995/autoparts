'use client';

import { ColorSchemeScript, MantineProvider, createTheme, Container, AppShell } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import { usePathname } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import AdminAuth from '@/components/admin/AdminAuth';
import { useState } from 'react';

const theme = createTheme({
  colors: {
    brand: [
      '#e3f2fd',
      '#bbdefb',
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#2196f3',
      '#1e88e5',
      '#1976d2',
      '#1565c0',
      '#0d47a1',
    ],
  },
  primaryColor: 'brand',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  components: {
    Container: {
      defaultProps: { p: 'md', size: 'lg' },
    },
    AppShell: {
      defaultProps: { padding: 'md' },
    },
    Group: {
      defaultProps: { gap: 'xs' },
    },
    Card: {
      defaultProps: { p: 'sm' },
    },
    Stack: {
      defaultProps: { gap: 'sm' },
    },
    Button: {
      defaultProps: { size: 'xs' },
    },
    TextInput: {
      defaultProps: { size: 'sm' },
    },
    NumberInput: {
      defaultProps: { size: 'sm' },
    },
    Textarea: {
      defaultProps: { size: 'sm' },
    },
    Modal: {
      defaultProps: { p: 'sm' },
    },
  },
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(false);
  const pathname = usePathname();

  // Render login/register without AdminAuth and admin chrome
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return (
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Notifications position="top-left" />
          <Container size="sm" py="sm">
            {children}
          </Container>
        </ModalsProvider>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications position="top-left" />
        <AdminAuth>
          {({ user }) => (
            <AppShell
              header={{ height: 52 }}
              navbar={{
                width: 240,
                breakpoint: 'sm',
                collapsed: { mobile: !opened, desktop: !opened },
              }}
            >
              <AppShell.Header>
                <AdminHeader toggle={() => setOpened((o) => !o)} opened={opened} user={user} />
              </AppShell.Header>
              <AppShell.Navbar>
                <AdminSidebar opened={opened} onClose={() => setOpened(false)} user={user} />
              </AppShell.Navbar>
              <AppShell.Main>
                <Container fluid p="md">
                  {children}
                </Container>
              </AppShell.Main>
            </AppShell>
          )}
        </AdminAuth>
      </ModalsProvider>
    </MantineProvider>
  );
}
