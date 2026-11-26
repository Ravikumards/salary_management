import { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { EmployeesPage } from './pages/EmployeesPage'
import { InsightsPage } from './pages/InsightsPage'

const theme = createTheme({
  palette: { primary: { main: '#2f5d8a' }, background: { default: '#f6f7f9' } },
  shape: { borderRadius: 8 },
})

type View = 'employees' | 'insights'

const viewFromHash = (): View => (window.location.hash === '#insights' ? 'insights' : 'employees')

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 4 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Salary Management
          </Typography>
          <Tabs value={view} onChange={(_, next: View) => (window.location.hash = next)} aria-label="Sections">
            <Tab value="employees" label="Employees" />
            <Tab value="insights" label="Insights" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }} component="main">
        {view === 'employees' ? <EmployeesPage /> : <InsightsPage />}
      </Container>
    </ThemeProvider>
  )
}
